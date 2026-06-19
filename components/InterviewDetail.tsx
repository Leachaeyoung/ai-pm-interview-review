'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteInterviewAction } from '@/lib/actions';
import type { Interview } from '@/lib/types';

export default function InterviewDetail({ interview }: { interview: Interview }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    await deleteInterviewAction(interview.id);
    router.push('/timeline');
  };

  return (
    <div className="max-w-3xl">
      {/* 返回链接 */}
      <Link
        href="/timeline"
        className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
      >
        ← 返回时间线
      </Link>

      {/* 头部信息 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {interview.company} · {interview.position}
        </h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-neutral-400">
          <span>{interview.date}</span>
          <span className="text-neutral-700">|</span>
          <span>{interview.round}</span>
          <span className="text-neutral-700">|</span>
          <span>{interview.questions.length} 个问题</span>
        </div>
      </div>

      {/* 问题列表 */}
      <div className="space-y-8">
        {interview.questions.map((q, index) => (
          <div key={q.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h3 className="flex items-center gap-3 text-lg font-medium text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-400">
                {index + 1}
              </span>
              {q.question}
            </h3>

            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                我的回答
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap">
                {q.answer}
              </p>
            </div>

            <div className="mt-5 rounded-lg bg-neutral-950 p-4 border border-neutral-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-500">
                复盘反思
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap">
                {q.reflection}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 操作区 */}
      <div className="mt-8 flex gap-3">
        <Link
          href={`/review?id=${interview.id}`}
          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 transition-colors"
        >
          编辑
        </Link>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
          >
            删除
          </button>
        ) : (
          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white hover:bg-red-600 transition-colors"
          >
            确认删除？
          </button>
        )}
      </div>
    </div>
  );
}
