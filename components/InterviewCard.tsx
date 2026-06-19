'use client';

import type { Interview } from '@/lib/types';

const ROUND_COLORS: Record<string, string> = {
  '一面': 'bg-blue-900/50 text-blue-300 border-blue-800',
  '二面': 'bg-purple-900/50 text-purple-300 border-purple-800',
  '三面': 'bg-amber-900/50 text-amber-300 border-amber-800',
  '终面': 'bg-red-900/50 text-red-300 border-red-800',
  'HR面': 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
};

export default function InterviewCard({
  interview,
  onClick,
}: {
  interview: Interview;
  onClick: () => void;
}) {
  const roundColor = ROUND_COLORS[interview.round] || 'bg-neutral-800 text-neutral-300 border-neutral-700';

  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-xl border border-neutral-800 bg-neutral-900 p-5 text-left transition-all hover:border-neutral-600 hover:bg-neutral-800/50"
    >
      {/* 左侧连接点 */}
      <div className="absolute -left-[33px] top-6 h-2.5 w-2.5 rounded-full border-2 border-neutral-600 bg-neutral-950 group-hover:border-neutral-400 transition-colors" />

      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-100">
            {interview.company} · {interview.position}
          </h3>
          <p className="mt-2 text-sm text-neutral-400">
            {interview.date} · {interview.round} · {interview.questions.length} 个问题
          </p>
        </div>
        <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${roundColor}`}>
          {interview.round}
        </span>
      </div>
    </button>
  );
}
