'use client';

import { useState, useEffect } from 'react';
import type { KnowledgeConcept } from '@/lib/types';
import { refreshKnowledgeAction, markKnowledgeAsReadAction } from '@/lib/actions';
import KnowledgeCard from '@/components/KnowledgeCard';

export default function KnowledgeClient({ initialConcepts }: { initialConcepts: KnowledgeConcept[] }) {
  const [concepts, setConcepts] = useState<KnowledgeConcept[]>(initialConcepts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 浏览知识页面时清除未读标记
  useEffect(() => {
    const hasNew = concepts.some((c) => c.isNew);
    if (hasNew) {
      // 本地立即更新
      setConcepts((prev) =>
        prev.map((c) => (c.isNew ? { ...c, isNew: false } : c))
      );
      // 服务端持久化
      markKnowledgeAsReadAction().catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setError('');
    setLoading(true);
    try {
      const fresh = await refreshKnowledgeAction();
      setConcepts(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : '刷新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 按优先级排序：must-act > focus > aware
  const priorityOrder = { 'must-act': 0, 'focus': 1, 'aware': 2 };
  const sorted = [...concepts].sort((a, b) => {
    const pa = a.priority ? (priorityOrder[a.priority] ?? 3) : 3;
    const pb = b.priority ? (priorityOrder[b.priority] ?? 3) : 3;
    return pa - pb;
  });

  const newCount = concepts.filter((c) => c.isNew).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">实时信息</h1>
          <p className="mt-1 text-sm text-neutral-500">
            AI 策展的最新行业概念，每日 9:00 自动刷新
            {newCount > 0 && (
              <span className="ml-2 text-sky-400">{newCount} 条新内容</span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '策展中...' : '刷新知识'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {concepts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <p className="text-lg">暂无知识卡片</p>
          <p className="mt-2 text-sm">点击右上角「刷新知识」获取最新 AI 行业概念</p>
        </div>
      ) : (
        <>
          {/* 每日简报摘要 */}
          {sorted.some((c) => c.isNew) && (
            <div className="mb-6 rounded-xl border border-sky-900/50 bg-sky-950/20 px-5 py-4">
              <p className="text-sm text-sky-300">
                📬 今早有 <span className="font-semibold text-white">{newCount} 条</span> 新概念等待你查阅。
                按优先级排序，<span className="text-red-300">红色标记</span> 需要本周行动。
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((c) => (
              <KnowledgeCard key={c.id} concept={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
