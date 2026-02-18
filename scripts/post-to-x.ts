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
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use Flash for speed/cost

                    const prompt = `
                    あなたはSNSマーケティングのプロです。
                    以下の記事の内容を元に、X（Twitter）で高いエンゲージメントを獲得するための「スレッド投稿（3〜4ツイート）」を作成してください。
                    
                    ## 出力フォーマット（厳守）
                    validなJSON配列（文字列の配列）のみを出力してください。Markdownのコードブロックは不要です。
                    例: ["ツイート1本文", "ツイート2本文", "ツイート3本文"]

                    ## 条件
                    1. **1ツイート目**: 強力なフック + 記事URL (${article.url}) を必ず含める。
                    2. **2〜3ツイート目**: 記事の要約や学び。
                    3. **最終ツイート**: 結論 + 再度URL誘導。
                    4. **文字数**: 各140字以内（日本語）。
                    5. **タグ**: #${article.tags.join(' #')} を適切に配置。

                    ## 記事タイトル
                    ${article.title}

                    ## 記事本文
                    ${article.content.slice(0, 5000)}
                    `;

                    const result = await model.generateContent(prompt);
                    const responseText = result.response.text();

                    // Clean up markdown code blocks if present
                    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                    tweets = JSON.parse(jsonStr);

                    if (!Array.isArray(tweets) || tweets.length === 0) {
                        throw new Error('Invalid JSON array from Gemini');
                    }
                    console.log('✅ Generated tweets:', tweets);

                } catch (e) {
                    console.error('❌ Gemini generation failed:', e);
                    // Fallback to simple post
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
