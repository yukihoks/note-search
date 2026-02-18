
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

  for (const [index, article] of articles.entries()) {
    console.log(`[${index + 1}/${articles.length}] Processing: ${article.name}`);
    
    const fullText = await scrapeFullText(article.key);
    
    // If scrape fails or is empty, fallback to the API provided body snippet
    const content = fullText.length > 50 ? fullText : article.body;

    searchIndex.push({
      id: article.id,
      title: article.name,
      slug: article.key,
      content: content,
      tags: article.hashtags.map(h => h.hashtag.name),
      thumbnail: article.eyecatch,
      publishedAt: article.publishAt,
      url: `https://note.com/${USER_ID}/n/${article.key}`,
    });

    // Random delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  }

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(searchIndex, null, 2));
  console.log(`Successfully generated search index with ${searchIndex.length} items at ${OUTPUT_FILE}`);
}

main();
