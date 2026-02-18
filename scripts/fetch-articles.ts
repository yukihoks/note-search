
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const USER_ID = 'yukidouji';
const API_BASE = 'https://note.com/api/v2';
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'search-index.json');

interface NoteApiContent {
    id: number;
    key: string;
    name: string;
    body: string;
    publishAt: string;
    eyecatch: string;
    hashtags: { hashtag: { name: string } }[];
}

interface SearchIndexItem {
    id: number;
    title: string;
    slug: string;
    content: string;
    tags: string[];
    thumbnail: string;
    publishedAt: string;
    url: string;
}

async function fetchArticleList() {
    let allContents: NoteApiContent[] = [];
    let page = 1;
    let isLastPage = false;

    console.log('Fetching article list...');

    while (!isLastPage) {
        try {
            const response = await axios.get(`${API_BASE}/creators/${USER_ID}/contents`, {
                params: {
                    kind: 'note',
                    page: page,
                },
            });

            const data = response.data.data;
            allContents = allContents.concat(data.contents);
            isLastPage = data.isLastPage;
            console.log(`Fetched page ${page}. Total items: ${allContents.length}`);
            page++;

            // Be nice to the API
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error('Error fetching list:', error);
            break;
        }
    }

    return allContents;
}

async function scrapeFullText(key: string): Promise<string> {
    const url = `https://note.com/${USER_ID}/n/${key}`;
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Note article content usually resides in specific containers.
        // We'll target the main article body. 
        // This selector might need adjustment based on actual HTML structure, 
        // but typically it's widely scoped or in 'div[data-name="body"]' or similar.
        // For now, let's grab the entire readable text container.
        // "p" tags inside the article wrapper are a safe bet.

        // Common Note structure: .o-noteContentText
        let text = '';

        // Attempt 1: Specific class for body text
        const bodyText = $('.o-noteContentText').text();
        if (bodyText) {
            text = bodyText;
        } else {
            // Fallback: extract from P tags in main
            $('main p').each((_, el) => {
                text += $(el).text() + '\n';
            });
        }

        return text.trim();
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        return '';
    }
}

async function main() {
    const articles = await fetchArticleList();
    const searchIndex: SearchIndexItem[] = [];

    console.log(`Starting full text scrape for ${articles.length} articles...`);

    // Load existing index to check for new articles
    let existingIndex: SearchIndexItem[] = [];
    try {
        const data = await fs.readFile(OUTPUT_FILE, 'utf-8');
        existingIndex = JSON.parse(data);
    } catch (e) {
        // File might not exist yet
    }

    const existingMap = new Map(existingIndex.map(item => [item.id, item]));
    const newArticles: SearchIndexItem[] = [];

    for (const [index, article] of articles.entries()) {
        console.log(`[${index + 1}/${articles.length}] Processing: ${article.name}`);

        let content = article.body;
        let finalItem: SearchIndexItem;

        // Optimization: Check if article already exists in our index
        if (existingMap.has(article.id)) {
            // Use cached content to avoid re-scraping and unnecessary requests
            const existingItem = existingMap.get(article.id)!;
            console.log(`  Start skipping scrape for existing article: ${article.name}`);

            finalItem = {
                ...existingItem,
                // Update potentially mutable fields from API response if needed, 
                // but keep the expensive scraped content.
                title: article.name,
                slug: article.key,
                tags: article.hashtags.map(h => h.hashtag.name),
                thumbnail: article.eyecatch,
                publishedAt: article.publishAt,
                url: `https://note.com/${USER_ID}/n/${article.key}`,
            };

        } else {
            // New article found! Scrape it.
            console.log(`✨ NEW ARTICLE FOUND (Scraping): ${article.name}`);

            const fullText = await scrapeFullText(article.key);
            content = fullText.length > 50 ? fullText : article.body;

            finalItem = {
                id: article.id,
                title: article.name,
                slug: article.key,
                content: content,
                tags: article.hashtags.map(h => h.hashtag.name),
                thumbnail: article.eyecatch,
                publishedAt: article.publishAt,
                url: `https://note.com/${USER_ID}/n/${article.key}`,
            };

            // Add to newArticles list for X posting
            newArticles.push(finalItem);

            // Random delay only when we actually scrape
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        }

        searchIndex.push(finalItem);
    }

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(searchIndex, null, 2));
    console.log(`Successfully generated search index with ${searchIndex.length} items.`);

    // Write new articles to a separate file for the X poster script
    if (newArticles.length > 0) {
        const newArticlesPath = path.join(process.cwd(), 'new-articles.json');
        await fs.writeFile(newArticlesPath, JSON.stringify(newArticles, null, 2));
        console.log(`[X-Post] Detected ${newArticles.length} new articles. Saved to new-articles.json`);
    } else {
        // Ensure file is empty so post script does nothing
        const newArticlesPath = path.join(process.cwd(), 'new-articles.json');
        await fs.writeFile(newArticlesPath, '[]');
        console.log('[X-Post] No new articles detected.');
    }
}

main();
