import { TwitterApi } from 'twitter-api-v2';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

interface SearchIndexItem {
    id: number;
    title: string;
    slug: string;
    url: string;
    tags: string[];
    content: string; // Ensure this exists in new-articles.json
}

async function main() {
    // 1. Read new articles
    const newArticlesPath = path.join(process.cwd(), 'new-articles.json');
    let newArticles: SearchIndexItem[] = [];

    try {
        const data = await fs.readFile(newArticlesPath, 'utf-8');
        newArticles = JSON.parse(data);
    } catch (error) {
        console.log('No new-articles.json found or invalid.');
        process.exit(0);
    }

    if (newArticles.length === 0) {
        console.log('No new articles to post.');
        process.exit(0);
    }

    // 2. Check for API Keys
    const appKey = process.env.X_API_KEY;
    const appSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessSecret = process.env.X_ACCESS_TOKEN_SECRET;
    const geminiKey = process.env.GOOGLE_API_KEY;

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
        console.error('❌ New articles detected, but X API Keys are missing in environment.');
        console.error('   Aborting to prevent marking articles as "processed" without posting.');
        console.error('   Please let the GitHub Action handle this, or configure .env locally.');
        process.exit(1);
    }

    // 3. Initialize Clients
    const twitterClient = new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
    });

    let genAI: GoogleGenerativeAI | null = null;
    if (geminiKey) {
        genAI = new GoogleGenerativeAI(geminiKey);
    } else {
        console.warn('⚠️ GOOGLE_API_KEY not found. Falling back to simple link post.');
    }

    // 4. Post Loop
    console.log(`Starting to post ${newArticles.length} articles to X...`);

    let hasError = false;
    for (const article of newArticles) {
        try {
            let tweets: string[] = [];

            if (genAI) {
                console.log(`🤖 Generating thread for: ${article.title} with Gemini...`);
                try {
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

                    const prompt = `
                    你是プロのテック系ブロガー「yukidouji」です。
                    以下の記事の内容を元に、X（Twitter）で**「インプレッション（閲覧数）とエンゲージメント（いいね・RT）」を最大化する**ための、拡散されやすい「スレッド投稿（3〜4ツイート）」を作成してください。

                    ## 方針
                    - **目的**: X上では「売り込み」は一切せず、純粋に「有益な情報」や「強い共感」を提供し、興味を持たせてNote記事へ誘導する（収益化はNote側で行うため、Xでは言及しない）。
                    - **ターゲット**: エンジニア、クリエイター、最新技術を追う層。

                    ## ブログ記事の前提
                    タイトル: ${article.title}
                    URL: ${article.url}
                    タグ: #${article.tags.join(' #')}

                    ## 投稿のスタイル（ペルソナ：yukidouji）
                    - **口調**: "だ・である"調、または "です・ます"調（記事のトーンに合わせる）。
                    - **トーン**: 
                        - **断定する**: 「〜だと思います」ではなく「〜だ」「〜である」。
                        - **逆説**: 「みんな〇〇だと思っているが、実は××だ」という構成が好ましい。
                        - **数字**: 具体的な数字や実績があれば強調する。
                    
                    ## 構成案
                        1. **1ツイート目（フック）**: 
                           - タイムラインの手指を止めさせる強力な一行目。
                           - 「常識の否定」「問いかけ」「衝撃的な事実」。
                           - 記事URLを必ず含める。
                        2. **2〜3ツイート目（ボディ）**: 
                           - 記事の「一番美味しい部分」の要約。
                           - 「これを知れてよかった」と思わせる有益な知見。
                           - 自身の苦労話や失敗談（共感を呼ぶ）。
                        3. **最終ツイート（CTA）**: 
                           - 議論を呼ぶような締めくくり。
                           - 「詳細はブログで解説しました（無料）」のような誘導。
                    
                    ## 禁止事項
                    - アフィリエイトや商品の紹介は**しない**。
                    - 「買ってください」「おすすめです」という表現は避ける。
                    - 嘘をつかない。

                    ## 出力フォーマット（厳守）
                    validなJSON配列（文字列の配列）のみを出力してください。Markdownのコードブロックは不要です。
                    例: ["ツイート1本文", "ツイート2本文", "ツイート3本文"]

                    ## 記事本文
                    ${article.content.slice(0, 8000)}
                    `;

                    const result = await model.generateContent(prompt);
                    const responseText = result.response.text();

                    // Clean up markdown code blocks if present
                    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                    tweets = JSON.parse(jsonStr);

                } catch (e) {
                    console.error('❌ Gemini generation failed:', e);
                    tweets = [];
                }
            }

            // Fallback if Gemini failed or key missing
            if (tweets.length === 0) {
                const hashtags = article.tags.map(t => `#${t}`).join(' ');
                tweets = [`【新着記事】\n${article.title}\n\n${hashtags}\n${article.url}`];
            }

            // Post Thread
            if (tweets.length === 1) {
                const { data } = await twitterClient.v2.tweet(tweets[0]);
                console.log(`✅ Posted single tweet: ${data.id}`);
            } else {
                const result = await twitterClient.v2.tweetThread(tweets);
                console.log(`✅ Posted thread of ${tweets.length} tweets. Root ID: ${result[0].data.id}`);
            }

            // Wait a bit between articles
            await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (error) {
            console.error(`❌ Failed to tweet article ${article.id}:`, error);
            hasError = true;
        }
    }

    if (hasError) {
        console.error('⚠️ One or more articles failed to post. Exiting with error to prevent index update.');
        process.exit(1);
    }
}

main();
