import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '台灣即時氣象地圖 — Taiwan Weather GIS',
  description: '中央氣象署開放資料即時視覺化地圖（森林系深色風格）',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
