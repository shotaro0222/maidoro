// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini APIの初期化
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;
    // フロントエンドから「何の項目か」を受け取る
    const fieldName = formData.get('fieldName') as string;

    if (!audioFile) {
      return NextResponse.json({ error: '音声データがありません' }, { status: 400 });
    }

    // 音声データをGeminiが読み込める形式に変換
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');

    // ★ ここがAIの賢さの心臓部 ★
    let prompt = "この音声をテキストに書き起こし、読みやすく整理してください。";
    
    if (fieldName && fieldName !== '自由入力') {
      prompt = `この音声は「${fieldName}」に関する業務報告です。
      内容を正確に読み取り、簡潔で分かりやすいプロフェッショナルな文章に整理してください。
      「あー」「えー」などの不要な言葉は排除し、要点が伝わるようにしてください。`;
    }

    // Gemini 1.5 Flash を呼び出し
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: audioFile.type || 'audio/webm',
          data: base64Audio
        }
      }
    ]);

    const text = result.response.text();

    return NextResponse.json({ report: text });
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'AIの処理中にエラーが発生しました' }, { status: 500 });
  }
}