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
    // 1. Check for API Keys
    const appKey = process.env.X_API_KEY;
    const appSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessSecret = process.env.X_ACCESS_TOKEN_SECRET;
    const geminiKey = process.env.GOOGLE_API_KEY;

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
        console.error('Missing X API Keys. Skipping X posting.');
        process.exit(0);
    }

    // 2. Read new articles
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

    for (const article of newArticles) {
        try {
            let tweets: string[] = [];

            if (genAI) {
                console.log(`🤖 Generating thread for: ${article.title} with Gemini...`);
                try {
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                    const prompt = `
                    你是プロのテック系ブロガー「yukidouji」です。
                    以下の記事の内容を元に、X（Twitter）でエンジニア層に刺さる、収益化を意識した「スレッド投稿（3〜4ツイート）」を作成してください。

                    ## ブログ記事の前提
                    タイトル: ${article.title}
                    URL: ${article.url}
                    タグ: #${article.tags.join(' #')}

                    ## ターゲット
                    - エンジニア、プログラマー、動画編集者
                    - 新しい技術（AI、Antigravity）に興味がある層
                    - 副業や収益化（A8.netなど）に関心がある層

                    ## 投稿のスタイル（ペルソナ：yukidouji）
                    - **口調**: "だ・である"調、または "です・ます"調（記事のトーンに合わせる）。
                    - **特徴**: 実体験重視。単なる機能紹介ではなく、「実際に使ってどうだったか」「どこで苦労したか」という**泥臭いプロセス**を語る。
                    - **感情**: 「すごい！」「疲れた...」「脳がショートした」など、人間味のある感情を適度に入れる。
                    - **構成**:
                        1. **1ツイート目**: インパクトのあるフック（常識の否定、強い共感など）。記事URLは必須。
                        2. **2〜3ツイート目**: 記事の要約（技術的知見）＋ 独自の体験（苦労話や感動）。
                        3. **最終ツイート**: 結論 ＋ 再度URL誘導 ＋ （もし記事内で紹介していれば）関連する機材やツールへの自然な言及（「作業のお供にマカロン食べた」など）。
                    
                    ## 禁止事項
                    - 嘘をつかない（体験していないことを書かない）。
                    - 売り込み臭を出しすぎない（あくまで「ついで」や「必需品」として紹介する）。
                    - ハッシュタグを乱用しない（3〜4個程度）。

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
            console.error(`Failed to tweet article ${article.id}:`, error);
        }
    }
}

main();
