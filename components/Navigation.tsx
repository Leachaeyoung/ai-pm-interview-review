'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/prepare', label: '面试前' },
  { href: '/review', label: '面试后' },
  { href: '/timeline', label: '复盘库' },
  { href: '/knowledge', label: '实时信息', badgeKey: 'knowledge' },
  { href: '/profile', label: '我的' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    // 每次页面加载时检查未读知识卡片数
    async function check() {
      try {
        const res = await fetch('/api/knowledge/unread-count');
        if (res.ok) {
          const data = await res.json();
          setNewCount(data.count);
        }
      } catch {
        // 静默失败，不显示红点
      }
    }
    check();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/timeline" className="text-lg font-semibold text-white tracking-tight">
          AI PM 面试复盘
        </Link>
        <nav className="flex gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm transition-colors relative ${
                  isActive
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                {item.label}
                {item.badgeKey === 'knowledge' && newCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {newCount > 9 ? '9+' : newCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
