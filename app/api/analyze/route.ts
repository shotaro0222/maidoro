// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 各モードのプロンプトを定義
const PROMPTS: Record<string, string> = {
  report: `あなたは現場作業員をサポートする優秀なAIアシスタントです。提供された音声データ（現場からの口頭報告）を聞き取り、以下のフォーマットに従って簡潔でプロフェッショナルな業務日報を作成してください。
【出力フォーマット】
■ 本日の業務内容:
■ 進捗状況:
■ 課題・申し送り事項:
■ 明日の予定:`,

  crm: `あなたは優秀な営業アシスタントです。提供された商談直後の音声メモを聞き取り、CRM/SFAに入力するための構造化されたレポートを作成してください。
【出力フォーマット】
■ 商談サマリー:
■ BANT条件 (予算/決裁権/ニーズ/導入時期):
■ 顧客の課題・懸念点:
■ ネクストアクション:`,

  incident: `あなたは安全管理アシスタントです。提供された現場の音声報告から、ヒヤリハット（インシデント）レポートを迅速に作成してください。事実を客観的かつ簡潔にまとめてください。
【出力フォーマット】
■ 発生日時・場所 (推定):
■ 事象・トラブル内容:
■ 原因 (推測含む):
■ 応急処置・結果:
■ 今後の対策・共有事項:`,

  inspection: `あなたは現場調査（現調）アシスタントです。提供された音声メモから、物件や現場の状況確認シートを作成してください。
【出力フォーマット】
■ 調査対象・箇所:
■ 状態・確認事項 (ポジティブな点):
■ 劣化・修繕が必要な点:
■ 総合所見・特記事項:`,

  braindump: `あなたは経営者・クリエイターの壁打ち相手となる優秀な編集者です。提供された乱雑な音声メモ（思考のブレインダンプ）から、要点を整理し、企画書やタスクリストのベースとなる構造化テキストを作成してください。
【出力フォーマット】
■ アイデアのコアコンセプト:
■ ターゲット・目的:
■ 具体的な構成要素・機能:
■ 検証すべきこと・ネクストアクション:`
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const reportType = formData.get('type') as string || 'report';

    if (!audioFile) {
      return NextResponse.json({ error: '音声データが見つかりません' }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // モードに応じたプロンプトを取得（存在しない場合は通常の日報）
    const promptBase = PROMPTS[reportType] || PROMPTS['report'];
    const finalPrompt = `${promptBase}\n※挨拶やAIとしての返答は一切不要です。純粋なテキストのみを出力し、言及がない項目は「特になし」と記載してください。`;

    const result = await model.generateContent([
      { inlineData: { mimeType: audioFile.type, data: base64Audio } },
      finalPrompt
    ]);

    const text = result.response.text();
    return NextResponse.json({ report: text });

  } catch (error) {
    console.error('AI解析エラー:', error);
    return NextResponse.json({ error: 'レポートの生成に失敗しました' }, { status: 500 });
  }
}