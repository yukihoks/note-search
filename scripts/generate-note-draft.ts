
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

async function generateNoteDraft(topic: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    あなたはプロのテック系ブロガー「yukidouji」です。
    ユーザーから指定されたテーマ「${topic}」について、以下の「月10万円マネタイズ戦略（有料記事なしVer）」に基づき、Note記事の構成案と本文を作成してください。

    ## 💰 マネタイズの2本柱（自然に組み込む）

    1. **高単価アフィリエイト（ミドルエンド：A8.net等）**
       - **内容**: エンジニアの「必需品」として、高単価案件（スクール、レンタルサーバー、転職など）を紹介する。
       - **書き方**: 「私もこれを使っています」「これがないと始まりません」と、あくまでツールの紹介として自然に差し込む。
       - 例: 「このBotを動かすサーバーはConoHa VPS一択です（安いので）」

    2. **物販アフィリエイト（フロントエンド：Amazon等）**
       - **内容**: 記事の休憩ポイントや余談として、作業効率化グッズ（キーボード、椅子、糖分補給のお菓子など）を紹介する。
       - **書き方**: 「作業のお供にマカロン必須」「この椅子のおかげで腰が守られた」など、親近感を持たせるエピソードを添える。

    ## ✍️ 記事のトーン＆マナー（重要）

    - **「痛み」の共有（Hook）**: 
      - 冒頭で「あるある」な悩み（残業、満員電車、エラー地獄など）を提示し、読者の共感を掴む。
    - **実体験ベース（Story）**: 
      - AIっぽさを消すため、「〜で苦労した」「〜というエラーで週末が溶けた」という泥臭いプロセスを語る。
    - **具体的な技術選定（Trust）**: 
      - なぜその技術を選んだのか？（例：なぜOpenAIではなくGeminiなのか？）コストや性能面から論理的に語る。
    - **売り込み感の払拭**: 
      - 「買ってください」とは言わず、「これを使えば楽になります」という**ベネフィット（利点）**を強調する。

    ## 記事の構成
    - **タイトル**: 検索意図を意識し、クリックしたくなるもの（30文字前後）。
    - **導入**: 読者の悩みに共感し、解決策を提示。
    - **本文**: 
        - 見出し（H2, H3）を使って構造化する。
        - 結論ファーストで書く。
        - 実際のコードや手順（プレースホルダーでも可）を入れる。
        - 上記の収益化ポイントを適切な場所に配置する。
    - **まとめ**: 行動を促す（Xのフォローや他の記事への誘導）。

    ## 出力フォーマット
    Markdown形式で出力してください。
    `;

    console.log(`🤖 Generating Note draft for topic: "${topic}"...`);

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        console.log('\n--- Generated Note Draft ---\n');
        console.log(text);
        console.log('\n----------------------------\n');
    } catch (error) {
        console.error('Error generating content:', error);
    }
}

// Get topic from command line args
const topic = process.argv[2];
if (!topic) {
    console.error('Please provide a topic. Usage: npx ts-node scripts/generate-note-draft.ts "Your Topic"');
    process.exit(1);
}

generateNoteDraft(topic);
