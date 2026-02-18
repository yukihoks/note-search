
import axios from 'axios';
import * as cheerio from 'cheerio';
import { program } from 'commander';

const USER_ID = 'yukidouji';

async function fetchArticleContent(url: string) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Title
        const title = $('meta[property="og:title"]').attr('content') || '';

        // Body Text
        let text = '';
        const bodyText = $('.o-noteContentText').text();
        if (bodyText) {
            text = bodyText;
        } else {
            $('main p').each((_, el) => {
                text += $(el).text() + '\n';
            });
        }

        return { title, text: text.trim() };
    } catch (error) {
        console.error('Error fetching article:', error);
        return null;
    }
}

function generatePrompt(title: string, content: string) {
    return `
あなたはSNSマーケティングのプロです。
以下のNote記事の内容を元に、X（Twitter）で高いエンゲージメントを獲得するための「スレッド投稿（3〜5ツイート）」を作成してください。

## 条件
1. **1ツイート目**: 読者の興味を惹く「フック」を強力にする（問いかけ、常識の否定、数字の提示など）。記事へのリンクを含める。
2. **2〜4ツイート目**: 記事の核心部分や、役立つポイントを要約して伝える。
3. **最終ツイート**: 結論と、記事全文を読むメリットを提示し、再度リンクへの誘導を行う。
4. **トーン**: プロフェッショナルだが親しみやすい、エンジニア・技術者向けの語り口。
5. **各ツイートの文字数**: 140字以内（日本語）。

## 記事情報
タイトル: ${title}

## 本文
${content.slice(0, 3000)}... (以下略)
`.trim();
}

async function main() {
    const url = process.argv[2];
    if (!url) {
        console.error('Please provide a Note URL.');
        process.exit(1);
    }

    console.log(`Fetching content from: ${url}...`);
    const article = await fetchArticleContent(url);

    if (!article) {
        console.error('Failed to fetch article.');
        process.exit(1);
    }

    const prompt = generatePrompt(article.title, article.text);

    console.log('\n--- AI PROMPT (Copy below) ---\n');
    console.log(prompt);
    console.log('\n-----------------------------\n');
    console.log('Copy this prompt and paste it into ChatGPT or Claude to generate your thread.');
}

main();
