import './globals.css' // ← これを一番上に追加！

export const metadata = {
  title: 'Mind Dump',
  description: 'AIを使った思考整理アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}