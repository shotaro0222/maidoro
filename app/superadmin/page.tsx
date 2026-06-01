// app/superadmin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Building2, Search, Activity, Database, ShieldAlert, Users, FileText, Settings, ArrowUpRight, Lock, KeyRound, Home, LogOut, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'

// ※全社横断のダミーデータ（テナントとユーザー用）
const allTenants = [
  { id: 'ORG-1001', name: '株式会社 サンプル工務店', plan: 'Business', users: 15, reports: 1240, status: 'Active' },
  { id: 'ORG-1002', name: '佐藤設備', plan: 'Light', users: 3, reports: 45, status: 'Active' },
]

const allUsers = [
  { id: 'U-001', orgName: 'サンプル工務店', name: '鈴木 一郎', role: 'テナント管理者', email: 'suzuki@example.com' },
  { id: 'U-002', orgName: 'サンプル工務店', name: '田中 勇気', role: 'スタッフ', email: 'tanaka@example.com' },
  { id: 'U-003', orgName: '佐藤設備', name: '佐藤 健太', role: 'テナント管理者', email: 'sato@example.com' },
]

type Report = {
  id: string
  type: string
  status: string
  created_at: string
  content: string
}

export default function SaaSAdminDashboard() {
  // 認証とデータ取得のState
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [activeTab, setActiveTab] = useState<'tenants' | 'reports' | 'users'>('tenants')
  
  const [dbReports, setDbReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const SUPERADMIN_PASSWORD = 'superadmin'

  // ログイン後にSupabaseから本物のデータを取得
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchData = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
      if (data) setDbReports(data)
      setLoading(false)
    }

    fetchData()
  }, [isAuthenticated])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordInput === SUPERADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setLoginError(false)
    } else {
      setLoginError(true)
      setPasswordInput('')
    }
  }

  // 全データをCSVでダウンロードする機能
  const downloadCSV = () => {
    if (dbReports.length === 0) return alert('データがありません')
    
    const headers = ['ID', '日時', '項目名', '内容']
    const csvContent = [
      headers.join(','),
      ...dbReports.map(r => 
        `"${r.id}","${new Date(r.created_at).toLocaleString('ja-JP')}","${r.type}","${r.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
      )
    ].join('\n')

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `system_reports_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 未ログイン時の画面（Roseカラーベース）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-rose-500/30">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">Master Console</h1>
          <p className="text-slate-400 text-sm text-center mb-8 leading-relaxed">
            システム全体管理用のアカウントです。<br/>マスターパスワードを入力してください。
          </p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="マスターパスワード"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  autoFocus
                />
              </div>
              {loginError && <p className="text-rose-500 text-xs mt-2 font-bold ml-1">パスワードが間違っています。</p>}
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white py-3.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20">
              システムにログイン
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <Link href="/" className="text-slate-500 hover:text-rose-400 text-sm transition font-bold flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> 録音画面に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ログイン成功後の画面
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* 運営用グローバルヘッダー */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-xl shadow-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20 border border-rose-500/30">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">SaaS Master Console</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Operated by Straid LLC</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-bold tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase mb-1 inline-block">
              Super Admin
            </span>
            <p className="text-xs font-bold text-slate-300">System Operator</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/50 font-bold text-sm text-rose-400">
            S
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* サイドナビゲーション */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 shrink-0 overflow-y-auto hidden md:block flex flex-col">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Master Database</p>
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('tenants')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'tenants' ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Building2 className="w-4 h-4" />
              テナント (企業) 管理
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'reports' ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <FileText className="w-4 h-4" />
              全日報マスタービュー
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'users' ? 'bg-rose-500/10 text-rose-400' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Users className="w-4 h-4" />
              全ユーザーアカウント
            </button>
          </nav>
          
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 px-2 mt-8">System</p>
          <nav className="space-y-1 mb-8">
            <button className="w-full flex items-center gap-3 text-slate-400 hover:bg-slate-800 px-4 py-3 rounded-xl font-bold text-sm transition">
              <Activity className="w-4 h-4" />
              API稼働ログ・コスト
            </button>
            <button className="w-full flex items-center gap-3 text-slate-400 hover:bg-slate-800 px-4 py-3 rounded-xl font-bold text-sm transition">
              <Settings className="w-4 h-4" />
              システム全体設定
            </button>
          </nav>

          <div className="mt-auto pt-4 border-t border-slate-800 space-y-2">
            <Link href="/" className="w-full flex items-center gap-3 text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 px-4 py-3 rounded-xl text-sm transition font-bold">
              <Home className="w-4 h-4" />
              録音画面に戻る
            </Link>
            <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 px-4 py-3 rounded-xl text-sm transition font-bold">
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto w-full">
          
          {/* システム稼働サマリー */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-4 -mt-4 transition-all group-hover:scale-150"></div>
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <Building2 className="w-5 h-5 text-rose-400" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">総テナント数</h3>
              </div>
              <p className="text-3xl font-bold text-white font-mono mt-2">128</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-4 -mt-4 transition-all group-hover:scale-150"></div>
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">アクティブユーザー</h3>
              </div>
              <p className="text-3xl font-bold text-white font-mono mt-2">842</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-4 -mt-4 transition-all group-hover:scale-150"></div>
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">実生成日報数</h3>
              </div>
              {/* ダミーではなく、本物のデータベースの件数を表示 */}
              <p className="text-3xl font-bold text-white font-mono mt-2">{loading ? '...' : dbReports.length}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            
            {/* テーブルヘッダー＆検索 */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {activeTab === 'tenants' && <><Building2 className="w-5 h-5 text-rose-400"/> テナント一覧</>}
                {activeTab === 'reports' && <><FileText className="w-5 h-5 text-rose-400"/> 全社横断 日報データ</>}
                {activeTab === 'users' && <><Users className="w-5 h-5 text-rose-400"/> 全ユーザーマスタ</>}
              </h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {activeTab === 'reports' && (
                  <button onClick={downloadCSV} className="hidden sm:flex bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold items-center gap-2 transition whitespace-nowrap">
                    <Download className="w-3.5 h-3.5" /> CSVエクスポート
                  </button>
                )}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" placeholder="横断検索..." className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500" />
                </div>
              </div>
            </div>

            {/* コンテンツ切り替え（テーブル） */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                
                {/* テナントタブ（ダミー） */}
                {activeTab === 'tenants' && (
                  <>
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">企業名 / ID</th>
                        <th className="px-6 py-4 font-bold">プラン</th>
                        <th className="px-6 py-4 font-bold">ユーザー数</th>
                        <th className="px-6 py-4 font-bold">状態</th>
                        <th className="px-6 py-4 text-right font-bold">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {allTenants.map(tenant => (
                        <tr key={tenant.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-200">{tenant.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{tenant.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold border bg-slate-800 text-slate-300 border-slate-700">{tenant.plan}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-300">{tenant.users}名</td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-emerald-400">稼働中</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 justify-end w-full">
                              設定 <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* レポートタブ（本物のデータベース連動） */}
                {activeTab === 'reports' && (
                  <>
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">提出日時</th>
                        <th className="px-6 py-4 font-bold">報告者</th>
                        <th className="px-6 py-4 font-bold">項目タイプ</th>
                        <th className="px-6 py-4 font-bold">AIサマリー</th>
                        <th className="px-6 py-4 text-right font-bold">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {loading ? (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-rose-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                      ) : dbReports.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-500">データがありません</td></tr>
                      ) : (
                        dbReports.map(report => (
                          <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                              {new Date(report.created_at).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 text-slate-300 font-bold">ゲストユーザー</td>
                            <td className="px-6 py-4">
                              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded text-[10px] font-bold">
                                {report.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-300 truncate max-w-xs">
                              {report.content.split('\n').find(line => line.trim().length > 0)?.substring(0, 30) || '内容なし'}...
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 justify-end w-full">
                                詳細 <ArrowUpRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </>
                )}

                {/* ユーザータブ（ダミー） */}
                {activeTab === 'users' && (
                  <>
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">所属企業</th>
                        <th className="px-6 py-4 font-bold">ユーザー名</th>
                        <th className="px-6 py-4 font-bold">権限レベル</th>
                        <th className="px-6 py-4 font-bold">Email</th>
                        <th className="px-6 py-4 text-right font-bold">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {allUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-slate-300 font-bold">{user.orgName}</td>
                          <td className="px-6 py-4">
                            <div className="text-slate-200 font-bold">{user.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{user.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${user.role === 'テナント管理者' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs font-mono">{user.email}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 justify-end w-full">
                              強制ログアウト等の管理 <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}