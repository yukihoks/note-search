
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

interface SearchIndexItem {
    id: number;
    title: string;
    slug: string;
    url: string;
    tags: string[];
}

async function main() {
    // 1. Check for API Keys
    const appKey = process.env.X_API_KEY;
    const appSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessSecret = process.env.X_ACCESS_TOKEN_SECRET;

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
        console.error('Missing X API Keys. Skipping X posting.');
        process.exit(0); // Exit successfully to not break the build/action
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

    // 3. Initialize Client
    const client = new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
    });

    // 4. Post Loop
    console.log(`Starting to post ${newArticles.length} articles to X...`);

    for (const article of newArticles) {
        try {
            const tags = article.tags.map(t => `#${t}`).join(' ');
            const text = `【新着記事】\n${article.title}\n\n${tags}\n${article.url}`;

            // Check length (simple check, Twitter counts URLs differently but this is safe side)
            // If too long, truncate title? For now, assume titles are reasonable.

            const { data: createdTweet } = await client.v2.tweet(text);
            console.log(`Successfully tweeted: ${createdTweet.id} - ${article.title}`);

            // Wait a bit between tweets
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`Failed to tweet article ${article.id}:`, error);
            // We continue to next article even if one fails
        }
    }
}

main();
