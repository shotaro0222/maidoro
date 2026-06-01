// app/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Mic, Settings, LogOut, CheckCircle2, MessageSquareWarning, ArrowRight, Loader2, Plus, Trash2, Home, Lock, KeyRound, User } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

// データの型定義
type Report = {
  id: string;
  author: string;
  role: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  summary: string;
  fullText: string;
  feedback: string;
}

type Field = {
  id: string;
  name: string;
}

export default function TenantAdminDashboard() {
  // ▼ 認証用のState（ログインIDと、通信中のローディング状態を追加）
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginId, setLoginId] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const [activeTab, setActiveTab] = useState<'reports' | 'settings'>('reports')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFeedback, setEditingFeedback] = useState<{ [key: string]: string }>({})
  const [fields, setFields] = useState<Field[]>([])
  const [newFieldName, setNewFieldName] = useState('')
  const [isAddingField, setIsAddingField] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      const supabase = createClient()
      
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (reportsData) {
        const formattedData: Report[] = reportsData.map((row: any) => ({
          id: row.id,
          author: 'ゲストユーザー',
          role: getRoleName(row.type),
          date: new Date(row.created_at).toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
          }),
          status: 'pending',
          summary: generateSummary(row.content),
          fullText: row.content,
          feedback: ''
        }))
        setReports(formattedData)
      }

      const { data: fieldsData } = await supabase
        .from('report_fields')
        .select('*')
        .order('created_at', { ascending: true })
        
      if (fieldsData) {
        setFields(fieldsData)
      }

      setLoading(false)
    }

    fetchData()
  }, [isAuthenticated])

  const getRoleName = (type: string) => {
    const types: { [key: string]: string } = { report: '業務日報', crm: '商談メモ', incident: 'ヒヤリハット', inspection: '現調記録', braindump: 'アイデア' }
    return types[type] || type
  }

  const generateSummary = (text: string) => {
    const firstLine = text.split('\n').find(line => line.trim().length > 0) || '内容なし'
    return firstLine.substring(0, 30) + (firstLine.length > 30 ? '...' : '')
  }

  const handleApprove = (id: string) => setReports(reports.map(r => r.id === id ? { ...r, status: 'approved', feedback: editingFeedback[id] || r.feedback } : r))
  const handleReject = (id: string) => setReports(reports.map(r => r.id === id ? { ...r, status: 'rejected', feedback: editingFeedback[id] || r.feedback } : r))
  const handleFeedbackChange = (id: string, text: string) => setEditingFeedback({ ...editingFeedback, [id]: text })

  const handleAddField = async () => {
    if (!newFieldName.trim()) return
    setIsAddingField(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('report_fields').insert([{ name: newFieldName.trim() }]).select().single()
    if (!error && data) {
      setFields([...fields, data])
      setNewFieldName('')
    }
    setIsAddingField(false)
  }

  const handleDeleteField = async (id: string) => {
    if (!confirm('この項目を削除しますか？')) return
    const supabase = createClient()
    const { error } = await supabase.from('report_fields').delete().eq('id', id)
    if (!error) setFields(fields.filter(f => f.id !== id))
  }

  // ▼ 本物のデータベースと通信してログイン照合する処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginId || !passwordInput) return
    
    setIsAuthenticating(true)
    setLoginError(false)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('login_id', loginId)
      .eq('password', passwordInput)
      .eq('role', 'admin') // admin権限かどうかもチェック
      .single()

    if (data && !error) {
      setIsAuthenticated(true)
      setLoginError(false)
    } else {
      setLoginError(true)
      setPasswordInput('') // パスワードだけリセット
    }
    
    setIsAuthenticating(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
              <Lock className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">管理者ログイン</h1>
          <p className="text-slate-400 text-sm text-center mb-8 leading-relaxed">
            設定やデータを確認するには<br/>発行されたIDとパスワードを入力してください。
          </p>
          
          {/* ▼ ログインフォーム（IDとパスワード） */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="ログインID"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  autoFocus
                  disabled={isAuthenticating}
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="パスワード"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  disabled={isAuthenticating}
                />
              </div>
              {loginError && <p className="text-rose-400 text-xs mt-2 font-bold ml-1">IDまたはパスワードが間違っています。</p>}
            </div>
            <button 
              type="submit" 
              disabled={isAuthenticating || !loginId || !passwordInput}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white py-3.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 mt-2"
            >
              {isAuthenticating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ログインする'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <Link href="/" className="text-slate-500 hover:text-indigo-400 text-sm transition font-bold flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> 録音画面に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 以下、ログイン成功後のAdmin画面
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-8 px-2 mt-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight block leading-tight">Voice-to-Report</span>
              <span className="text-[10px] text-slate-400">Manager Console</span>
            </div>
          </div>
          <nav className="space-y-1.5">
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'reports' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
              <CheckCircle2 className="w-4 h-4" /> 日報確認・承認
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'settings' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
              <Settings className="w-4 h-4" /> 入力項目設定
            </button>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-slate-800 space-y-2">
          <Link href="/" className="w-full flex items-center gap-3 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 px-4 py-3 rounded-xl text-sm transition font-bold">
            <Home className="w-4 h-4" /> 録音画面に戻る
          </Link>
          <button onClick={() => {setIsAuthenticated(false); setLoginId(''); setPasswordInput('');}} className="w-full flex items-center gap-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 px-4 py-3 rounded-xl text-sm transition font-bold">
            <LogOut className="w-4 h-4" /> ログアウト
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {activeTab === 'reports' && (
          <>
            <header className="mb-8 border-b border-slate-800 pb-6">
              <h1 className="text-2xl font-bold text-white">日報の確認・フィードバック</h1>
            </header>
            <div className="space-y-6 max-w-4xl">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-indigo-400"><Loader2 className="w-8 h-8 animate-spin mb-4" /><p className="font-bold">データを読み込み中...</p></div>
              ) : reports.length === 0 ? (
                <div className="text-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl"><p className="font-bold">まだ提出された日報はありません。</p></div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-5 flex justify-between items-start border-b border-slate-800/50 bg-slate-900/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 font-bold border border-slate-700 text-lg">{report.author.charAt(0)}</div>
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">{report.author}<span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-normal">{report.role}</span></h3>
                          <p className="text-xs text-slate-400 mt-1">{report.date}</p>
                        </div>
                      </div>
                      <div>
                        {report.status === 'pending' && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>未確認</span>}
                        {report.status === 'approved' && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />承認済</span>}
                      </div>
                    </div>
                    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">提出された日報</h4>
                        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 h-[220px] overflow-y-auto">
                          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{report.fullText}</pre>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">マネージャーフィードバック</h4>
                        {report.status === 'pending' ? (
                          <div className="flex flex-col h-full">
                            <textarea placeholder="フィードバックを入力..." value={editingFeedback[report.id] !== undefined ? editingFeedback[report.id] : ''} onChange={(e) => handleFeedbackChange(report.id, e.target.value)} className="w-full grow bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none mb-4" />
                            <div className="flex gap-2">
                              <button onClick={() => handleApprove(report.id)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> 承認して完了</button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 h-full flex flex-col">
                            <p className="text-sm text-indigo-200 leading-relaxed grow">{report.feedback || 'フィードバックなしで処理されました。'}</p>
                            <button onClick={() => setReports(reports.map(r => r.id === report.id ? { ...r, status: 'pending' } : r))} className="mt-4 text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1 w-fit"><ArrowRight className="w-3 h-3" /> 再編集する</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <header className="mb-8 border-b border-slate-800 pb-6">
              <h1 className="text-2xl font-bold text-white">入力項目設定</h1>
              <p className="text-sm text-slate-400 mt-1">現場スタッフが入力するフォーマット（項目）を自由に定義できます。</p>
            </header>
            <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex gap-3 mb-8">
                <input type="text" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddField()} placeholder="新しい項目名（例：業務内容、申し送り事項...）" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                <button onClick={handleAddField} disabled={isAddingField || !newFieldName.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition">{isAddingField ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 追加</button>
              </div>
              <div className="space-y-3">
                {fields.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-xl">項目が登録されていません。<br/>デフォルトではユーザーは自由に発話します。</div>
                ) : (
                  fields.map(field => (
                    <div key={field.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-4 rounded-xl">
                      <span className="font-bold text-slate-300">{field.name}</span>
                      <button onClick={() => handleDeleteField(field.id)} className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}