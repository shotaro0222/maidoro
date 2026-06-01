// app/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, Send, CheckCircle2, RotateCcw, ArrowRight, SkipForward } from 'lucide-react'
import { createClient } from './lib/supabase/client' // ※環境に合わせてパスを調整（'../lib/supabase/client' の場合もあります）

type Step = 'idle' | 'recording' | 'processing' | 'editing' | 'submitted'
type Field = { id: string; name: string }

export default function Home() {
  const [step, setStep] = useState<Step>('idle')
  
  // カスタム項目用の状態
  const [fields, setFields] = useState<Field[]>([])
  const [currentFieldIdx, setCurrentFieldIdx] = useState(0)
  const [fieldTexts, setFieldTexts] = useState<{ [key: string]: string }>({})
  const [isLoadingFields, setIsLoadingFields] = useState(true)
  
  const [reportText, setReportText] = useState<string>('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])

  // 起動時にAdminで設定した項目を読み込む
  useEffect(() => {
    const fetchFields = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('report_fields').select('*').order('created_at', { ascending: true })
      if (data && data.length > 0) {
        setFields(data)
      }
      setIsLoadingFields(false)
    }
    fetchFields()
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setStep('recording')
    } catch (error) {
      console.error('マイクアクセス失敗:', error)
      alert('マイクへのアクセスを許可してください。')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && step === 'recording') {
      mediaRecorderRef.current.stop()
      setStep('processing')
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setStep('processing')
    try {
      // Gemini APIへ音声送信
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('type', 'braindump') // 汎用的なテキスト化を依頼

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      const transcribedText = data.report || '内容を読み取れませんでした。'

      handleNextStep(transcribedText)
    } catch (error) {
      console.error(error)
      alert('AIの解析に失敗しました。')
      setStep('idle')
    }
  }

  // 「スキップ」ボタンが押されたとき（特になしとして扱う）
  const handleSkip = () => {
    handleNextStep('特になし')
  }

  // 次の項目へ進む、または完了して統合する処理
  const handleNextStep = (text: string) => {
    if (fields.length > 0) {
      const currentField = fields[currentFieldIdx]
      const updatedTexts = { ...fieldTexts, [currentField.name]: text.trim() }
      setFieldTexts(updatedTexts)

      if (currentFieldIdx < fields.length - 1) {
        // まだ次の項目がある場合
        setCurrentFieldIdx(currentFieldIdx + 1)
        setStep('idle')
      } else {
        // すべての項目が終わった場合、1つのテキストに合体させる
        const combined = fields.map(f => `■ ${f.name}\n${updatedTexts[f.name] || text.trim()}`).join('\n\n')
        setReportText(combined)
        setStep('editing')
      }
    } else {
      // 項目設定がない（自由録音）場合
      setReportText(text)
      setStep('editing')
    }
  }

  const handleSubmit = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reports')
        .insert([{ type: fields.length > 0 ? 'カスタム日報' : '自由入力', content: reportText }])

      if (error) throw error
      setStep('submitted')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('データの保存に失敗しました。')
    }
  }

  const resetAll = () => {
    setStep('idle')
    setCurrentFieldIdx(0)
    setFieldTexts({})
    setReportText('')
  }

  if (isLoadingFields) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-indigo-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-bold text-sm">システムを準備中...</p>
      </div>
    )
  }

  // 現在の項目名と進捗率
  const currentFieldName = fields.length > 0 ? fields[currentFieldIdx].name : '自由に入力してください'
  const progressPercent = fields.length > 0 ? (currentFieldIdx / fields.length) * 100 : 0

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md mx-auto p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* 進捗バー（項目がある場合のみ） */}
        {fields.length > 1 && step !== 'editing' && step !== 'submitted' && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {(step === 'idle' || step === 'recording' || step === 'processing') && (
          <div className="flex flex-col items-center py-8">
            <div className="text-center mb-10">
              {fields.length > 0 && (
                <span className="text-indigo-400 font-bold text-xs tracking-widest uppercase block mb-3">
                  Step {currentFieldIdx + 1} / {fields.length}
                </span>
              )}
              <h2 className="text-2xl font-bold text-white leading-relaxed">
                「{currentFieldName}」<br />について
              </h2>
            </div>

            <div className="flex justify-center mb-8 relative">
              {step === 'idle' && (
                <button onClick={startRecording} className="w-32 h-32 rounded-full bg-indigo-600 text-white flex flex-col items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:bg-indigo-500 hover:scale-105 transition-all">
                  <Mic className="w-10 h-10 mb-2" />
                  <span className="font-bold">録音開始</span>
                </button>
              )}
              {step === 'recording' && (
                <button onClick={stopRecording} className="w-32 h-32 rounded-full bg-red-500 text-white flex flex-col items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-pulse">
                  <Square className="w-8 h-8 mb-2" />
                  <span className="font-bold">停止する</span>
                </button>
              )}
              {step === 'processing' && (
                <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-indigo-500 flex flex-col items-center justify-center text-indigo-400 shadow-[0_0_40px_rgba(79,70,229,0.2)]">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <span className="font-bold text-sm">AI処理中...</span>
                </div>
              )}
            </div>

            {/* スキップボタン */}
            {step === 'idle' && fields.length > 0 && (
              <button 
                onClick={handleSkip}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-bold transition-colors mt-4"
              >
                特にない場合はスキップ <SkipForward className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* 最終確認・編集画面 */}
        {step === 'editing' && (
          <div className="flex flex-col animate-in fade-in zoom-in duration-300">
            <h3 className="text-sm font-bold text-indigo-400 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> 内容の確認・修正
            </h3>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="w-full h-64 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
            />
            <div className="flex gap-3 mt-6">
              <button onClick={resetAll} className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl text-sm font-bold hover:bg-slate-700 transition flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> やり直す
              </button>
              <button onClick={handleSubmit} className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> 送信する
              </button>
            </div>
          </div>
        )}

        {step === 'submitted' && (
          <div className="flex flex-col items-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">送信完了！</h3>
            <p className="text-slate-400 text-sm mb-8 text-center">
              お疲れ様でした。<br/>日報は正常に記録されました。
            </p>
            <button onClick={resetAll} className="bg-slate-800 text-slate-300 px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-700 transition">
              続けて入力する
            </button>
          </div>
        )}

      </div>
    </main>
  )
}