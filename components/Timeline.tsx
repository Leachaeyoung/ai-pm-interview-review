'use client';

import { motion } from 'framer-motion';
import type { Interview } from '@/lib/types';
import InterviewCard from './InterviewCard';

function groupByMonth(interviews: Interview[]): Map<string, Interview[]> {
  const groups = new Map<string, Interview[]>();
  for (const interview of interviews) {
    const key = interview.date.slice(0, 7); // "2026-06"
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(interview);
  }
  return groups;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${year}年${parseInt(month)}月`;
}

export default function Timeline({
  interviews,
  onSelect,
}: {
  interviews: Interview[];
  onSelect: (id: string) => void;
}) {
  const groups = groupByMonth(interviews);

  if (interviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <p className="text-lg">还没有面试记录</p>
        <p className="mt-2 text-sm">点击右上角「面试后」开始记录你的第一次面试复盘</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 时间线竖线 */}
      <div className="absolute left-[120px] top-0 bottom-0 w-px bg-neutral-800" />

      {Array.from(groups.entries()).map(([key, items]) => (
        <div key={key} className="mb-10">
          {/* 月份标签 */}
          <div className="flex items-center mb-6">
            <div className="w-[120px] pr-6 text-right">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400">
                <span className="h-2 w-2 rounded-full bg-neutral-600" />
                {formatMonthLabel(key)}
              </span>
            </div>
          </div>

          {/* 该月的卡片 */}
          <div className="ml-[120px] space-y-4">
            {items.map((interview, index) => (
              <motion.div
                key={interview.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <InterviewCard interview={interview} onClick={() => onSelect(interview.id)} />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
