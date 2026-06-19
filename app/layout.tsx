import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI PM 面试复盘',
  description: 'AI产品经理面试复盘与模拟面试工具',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
