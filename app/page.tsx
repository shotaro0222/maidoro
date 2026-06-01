// app/page.tsx
import VoiceRecorder from '@/components/VoiceRecorder'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* 背景の装飾 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 -z-10"></div>
      
      <div className="w-full max-w-md">
        <VoiceRecorder />
      </div>
      
      <div className="mt-8 text-center text-xs text-slate-500">
        Voice-to-Report © Straid LLC
      </div>
    </main>
  )
}