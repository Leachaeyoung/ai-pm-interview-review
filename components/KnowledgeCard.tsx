'use client';

import type { KnowledgeConcept } from '@/lib/types';
import { CATEGORY_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/types';

export default function KnowledgeCard({ concept }: { concept: KnowledgeConcept }) {
  const colorClass = CATEGORY_COLORS[concept.category] || 'bg-neutral-800 text-neutral-300 border-neutral-700';
  const priorityColor = concept.priority
    ? PRIORITY_COLORS[concept.priority]
    : 'bg-neutral-800/50 text-neutral-400 border-neutral-700';
  const priorityLabel = concept.priority
    ? PRIORITY_LABELS[concept.priority]
    : null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition-all hover:border-neutral-600 hover:bg-neutral-800/50 relative">
      {/* 未读标记 */}
      {concept.isNew && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-base font-semibold text-neutral-100 leading-snug pr-4">
          {concept.title}
        </h3>
        <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${colorClass}`}>
          {concept.category}
        </span>
      </div>

      <p className="text-sm text-neutral-400 leading-relaxed">
        {concept.summary}
      </p>

      {/* 行动建议 */}
      {concept.actionableInsight && (
        <div className="mt-3 rounded-lg bg-sky-950/30 border border-sky-900/50 px-3 py-2">
          <p className="text-xs text-sky-300 leading-relaxed">
            <span className="font-medium">💡 行动建议：</span>
            {concept.actionableInsight}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <span>{concept.source || '综合来源'}</span>
          {priorityLabel && (
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${priorityColor}`}>
              {priorityLabel}
            </span>
          )}
        </div>
        <span>{concept.pushedAt.slice(0, 10)}</span>
      </div>
    </div>
  );
}
