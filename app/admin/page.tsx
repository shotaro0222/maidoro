// app/admin/page.tsx
'use client'

import { useState } from 'react'
import { Mic, Users, LogOut, CheckCircle2, MessageSquareWarning, ArrowRight } from 'lucide-react'

// ※UI動作用のダミーデータ（ステータスを追加）
const initialReports = [
  {
    id: 1, author: '鈴木 一郎', role: '現場監督', date: '2026-05-31 16:15', status: 'pending',
    summary: 'Aビル配管工事。予定の8割完了。明日は残りのジョイント接続。',
    fullText: '■ 本日の業務内容:\n・Aビル3階の配管敷設\n\n■ 進捗状況:\n・予定の8割完了\n\n■ 課題・申し送り事項:\n・資材（L字管）が明日不足する可能性あり。至急発注願い。\n\n■ 明日の予定:\n・残り作業と片付け',
    feedback: ''
  },
  {
    id: 2, author: '佐藤 健太', role: '電気工事', date: '2026-05-31 15:30', status: 'approved',
    summary: 'Bテナント内装配線。トラブルなく完了。',
    fullText: '■ 本日の業務内容:\n・Bテナントの照明配線\n\n■ 進捗状況:\n・100%完了\n\n■ 課題・申し送り事項:\n・特になし\n\n■ 明日の予定:\n・Cテナントの現調',
    feedback: 'お疲れ様でした。明日のCテナントの現調も安全第一でお願いします。'
  }
]

export default function TenantAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'reports' | 'staff'>('reports')
  const [reports, setReports] = useState(initialReports)
  const [editingFeedback, setEditingFeedback] = useState<{ [key: number]: string }>({})

  // マネージャーの承認処理
  const handleApprove = (id: number) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'approved', feedback: editingFeedback[id] || r.feedback } : r))
  }

  // マネージャーの差し戻し処理
  const handleReject = (id: number) => {
    setReports(reports.map(r => r.id === id ? { ...r, status: 'rejected', feedback: editingFeedback[id] || r.feedback } : r))
  }

  const handleFeedbackChange = (id: number, text: string) => {
    setEditingFeedback({ ...editingFeedback, [id]: text })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* サイドバー */}
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
            <button 
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'reports' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              日報確認・承認
            </button>
            <button 
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'staff' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
            >
              <Users className="w-4 h-4" />
              スタッフ管理
            </button>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 px-4 py-3 rounded-xl text-sm transition font-bold">
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <h1 className="text-2xl font-bold text-white">日報の確認・フィードバック</h1>
          <p className="text-sm text-slate-400 mt-1">スタッフから提出された日報を確認し、必要に応じて承認・差し戻しを行います。</p>
        </header>

        {activeTab === 'reports' && (
          <div className="space-y-6 max-w-4xl">
            {reports.map((report) => (
              <div key={report.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                
                {/* ヘッダー部分 */}
                <div className="p-5 flex justify-between items-start border-b border-slate-800/50 bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 font-bold border border-slate-700 text-lg">
                      {report.author.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {report.author}
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-normal">{report.role}</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{report.date}</p>
                    </div>
                  </div>
                  
                  {/* ステータスバッジ */}
                  <div>
                    {report.status === 'pending' && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>未確認</span>}
                    {report.status === 'approved' && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />承認済</span>}
                    {report.status === 'rejected' && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><MessageSquareWarning className="w-3.5 h-3.5" />差戻し</span>}
                  </div>
                </div>
                
                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* 左カラム：現場からの日報本文 */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">提出された日報</h4>
                    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 h-[220px] overflow-y-auto">
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {report.fullText}
                      </pre>
                    </div>
                  </div>

                  {/* 右カラム：マネージャーのアクション領域 */}
                  <div className="flex flex-col">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">マネージャーフィードバック</h4>
                    
                    {report.status === 'pending' ? (
                      <div className="flex flex-col h-full">
                        <textarea
                          placeholder="お疲れ様です。資材発注の件、承知しました。手配しておきます。"
                          value={editingFeedback[report.id] !== undefined ? editingFeedback[report.id] : ''}
                          onChange={(e) => handleFeedbackChange(report.id, e.target.value)}
                          className="w-full grow bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none mb-4"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleReject(report.id)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-rose-400 py-2.5 rounded-lg text-sm font-bold transition border border-slate-700"
                          >
                            差し戻す
                          </button>
                          <button 
                            onClick={() => handleApprove(report.id)}
                            className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            承認して完了
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 h-full flex flex-col">
                        <p className="text-sm text-indigo-200 leading-relaxed grow">
                          {report.feedback || 'フィードバックなしで承認されました。'}
                        </p>
                        <button 
                          onClick={() => setReports(reports.map(r => r.id === report.id ? { ...r, status: 'pending' } : r))}
                          className="mt-4 text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1 w-fit"
                        >
                          <ArrowRight className="w-3 h-3" />
                          再編集する
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}