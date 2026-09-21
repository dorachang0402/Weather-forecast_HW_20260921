import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CWA API Test — Alo DIC-2',
  description: 'Milestone 1 CWA API connection test',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
