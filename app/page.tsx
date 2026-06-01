// app/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Loader2, Send, CheckCircle2, RotateCcw, ArrowRight, SkipForward, FileAudio, Settings, AlignLeft } from 'lucide-react'
import { createClient } from '../lib/supabase/client'
import Link from 'next/link'

type Step = 'idle' | 'recording' | 'processing' | 'editing' | 'submitted'
type Field = { id: string; name: string }

export default function Home() {
  const [step, setStep] = useState<Step>('idle')
  
  const [fields, setFields] = useState<Field[]>([])
  const [currentFieldIdx, setCurrentFieldIdx] = useState(0)
  const [fieldTexts, setFieldTexts] = useState<{ [key: string]: string }>({})
  const [isLoadingFields, setIsLoadingFields] = useState(true)
  
  const [reportText, setReportText] = useState<string>('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])

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

  const processAudio = async (audioBlob: Blob) => {
    setStep('processing')
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      
      const currentFieldName = fields.length > 0 ? fields[currentFieldIdx].name : '自由入力'
      formData.append('fieldName', currentFieldName)

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

  const handleSkip = () => {
    handleNextStep('特になし')
  }

  const handleNextStep = (text: string) => {
    if (fields.length > 0) {
      const currentField = fields[currentFieldIdx]
      const updatedTexts = { ...fieldTexts, [currentField.name]: text.trim() }
      setFieldTexts(updatedTexts)

      if (currentFieldIdx < fields.length - 1) {
        setCurrentFieldIdx(currentFieldIdx + 1)
        setStep('idle')
      } else {
        const combined = fields.map(f => `■ ${f.name}\n${updatedTexts[f.name] || text.trim()}`).join('\n\n')
        setReportText(combined)
        setStep('editing')
      }
    } else {
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

  const currentFieldName = fields.length > 0 ? fields[currentFieldIdx].name : '自由入力'
  const progressPercent = fields.length > 0 ? (currentFieldIdx / fields.length) * 100 : 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col">
      
      {/* ヘッダー */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-white">Voice-to-Report</span>
          </div>
          <Link href="/admin" className="text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1.5 bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700/50">
            <Settings className="w-3.5 h-3.5" />
            管理画面
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
        
        {/* タイトルエリア */}
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3 flex items-center justify-center md:justify-start gap-3">
            <FileAudio className="w-7 h-7 text-indigo-400" />
            AI 音声レポート入力
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            マイクに向かって話すだけで、AIが自動でフォーマット通りにテキストを整理し、システムへ保存します。
          </p>
        </div>

        {/* 録音カード */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
          
          {/* 進捗バー */}
          {fields.length > 1 && step !== 'editing' && step !== 'submitted' && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          <div className="p-8 md:p-10">
            {(step === 'idle' || step === 'recording' || step === 'processing') && (
              <div className="flex flex-col items-center">
                
                {/* ★ 追加：全ステップのロードマップ表示 ★ */}
                {fields.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-8 w-full">
                    {fields.map((field, idx) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                          idx === currentFieldIdx 
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.3)]' // 現在のステップ
                            : idx < currentFieldIdx 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' // 完了したステップ
                              : 'bg-slate-800/50 border-slate-700/50 text-slate-500' // まだのステップ
                        }`}>
                          {idx < currentFieldIdx ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : null}
                          {field.name}
                        </span>
                        {idx < fields.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-slate-700" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 現在の項目表示 */}
                <div className="text-center mb-10 w-full">
                  <h2 className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
                    「<span className="text-indigo-300 border-b-2 border-indigo-500/30 pb-1">{currentFieldName}</span>」<br />
                    について
                  </h2>
                </div>

                {/* 録音ボタンエリア */}
                <div className="flex justify-center mb-8 relative">
                  {step === 'idle' && (
                    <button onClick={startRecording} className="w-36 h-36 rounded-full bg-indigo-600 text-white flex flex-col items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.25)] hover:bg-indigo-500 hover:scale-105 transition-all group border-4 border-indigo-500/30">
                      <Mic className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-sm tracking-wide">録音開始</span>
                    </button>
                  )}
                  {step === 'recording' && (
                    <button onClick={stopRecording} className="w-36 h-36 rounded-full bg-red-500 text-white flex flex-col items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-pulse border-4 border-red-400/30">
                      <Square className="w-8 h-8 mb-2" />
                      <span className="font-bold text-sm tracking-wide">停止する</span>
                    </button>
                  )}
                  {step === 'processing' && (
                    <div className="w-36 h-36 rounded-full bg-slate-800 border-4 border-indigo-500/50 flex flex-col items-center justify-center text-indigo-400 shadow-[0_0_40px_rgba(79,70,229,0.1)]">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="font-bold text-sm tracking-wide">AI処理中...</span>
                    </div>
                  )}
                </div>

                {/* スキップボタン */}
                {step === 'idle' && fields.length > 0 && (
                  <button 
                    onClick={handleSkip}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-bold transition-colors bg-slate-950 px-6 py-2.5 rounded-full border border-slate-800"
                  >
                    特にない場合はスキップ <SkipForward className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* 最終確認・編集画面 */}
            {step === 'editing' && (
              <div className="flex flex-col animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                  <AlignLeft className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">内容の確認・修正</h3>
                </div>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="w-full h-64 bg-slate-950 border border-slate-700 rounded-xl p-5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none leading-relaxed"
                />
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button onClick={resetAll} className="flex-1 bg-slate-800 text-slate-300 py-3.5 rounded-xl text-sm font-bold hover:bg-slate-700 transition flex items-center justify-center gap-2 border border-slate-700">
                    <RotateCcw className="w-4 h-4" /> やり直す
                  </button>
                  <button onClick={handleSubmit} className="flex-[2] bg-indigo-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> 送信する
                  </button>
                </div>
              </div>
            )}

            {/* 送信完了画面 */}
            {step === 'submitted' && (
              <div className="flex flex-col items-center py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-500/20">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">送信完了！</h3>
                <p className="text-slate-400 text-sm mb-10 text-center leading-relaxed">
                  お疲れ様でした。<br/>レポートは正常にデータベースへ記録されました。
                </p>
                <button onClick={resetAll} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-8 py-3.5 rounded-xl text-sm font-bold transition flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  続けて入力する
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}