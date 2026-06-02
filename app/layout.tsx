// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// ▼ スマホアプリ特有の画面設定（ズーム禁止など）
export const viewport: Viewport = {
  themeColor: "#4f46e5", // スマホの上のステータスバーの色（インディゴカラー）
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // ダブルタップで画面が拡大されるのを防ぐ（アプリっぽくするため）
};

// ▼ アプリの情報とPWAの読み込み設定
export const metadata: Metadata = {
  title: "Voice-to-Report",
  description: "現場向け 音声日報アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VoiceReport",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}