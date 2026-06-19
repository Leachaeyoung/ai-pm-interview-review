'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { Interview, Question } from '@/lib/types';
import { ROUND_OPTIONS } from '@/lib/types';

interface FormData {
  company: string;
  position: string;
  date: string;
  round: string;
  questions: Question[];
}

function emptyQuestion(): Question {
  return { id: uuid(), question: '', answer: '', reflection: '' };
}

export default function InterviewForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: Interview;
  onSave: (data: Omit<Interview, 'id' | 'createdAt'>) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormData>({
    company: initialData?.company || '',
    position: initialData?.position || '',
    date: initialData?.date || new Date().toISOString().slice(0, 10),
    round: initialData?.round || '一面',
    questions: initialData?.questions || [emptyQuestion()],
  });
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateQuestion = (id: string, field: keyof Question, value: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      ),
    }));
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, emptyQuestion()],
    }));
  };

  const removeQuestion = (id: string) => {
    if (form.questions.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const handleSubmit = async () => {
    if (!form.company.trim() || !form.position.trim()) return;
    setSaving(true);
    await onSave({
      company: form.company.trim(),
      position: form.position.trim(),
      date: form.date,
      round: form.round,
      questions: form.questions.filter((q) => q.question.trim()),
    });
  };

  return (
    <div className="max-w-3xl">
      {/* 基本信息 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1.5">公司</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => updateField('company', e.target.value)}
            placeholder="例如：字节跳动"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1.5">岗位</label>
          <input
            type="text"
            value={form.position}
            onChange={(e) => updateField('position', e.target.value)}
            placeholder="例如：AI产品经理"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1.5">面试日期</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => updateField('date', e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-1.5">轮次</label>
          <select
            value={form.round}
            onChange={(e) => updateField('round', e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
          >
            {ROUND_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-neutral-800 my-6" />

      {/* 问题列表 */}
      <div className="space-y-6">
        {form.questions.map((q, index) => (
          <div key={q.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-neutral-300">问题 {index + 1}</h3>
              {form.questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
                >
                  删除此问题
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">面试题目</label>
                <textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                  placeholder="面试官问的具体问题..."
                  rows={2}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">我的回答思路</label>
                <textarea
                  value={q.answer}
                  onChange={(e) => updateQuestion(q.id, 'answer', e.target.value)}
                  placeholder="我当时是怎么回答的..."
                  rows={3}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-500 mb-1">复盘反思</label>
                <textarea
                  value={q.reflection}
                  onChange={(e) => updateQuestion(q.id, 'reflection', e.target.value)}
                  placeholder="哪些地方可以改进？有什么收获？"
                  rows={3}
                  className="w-full rounded-lg border border-amber-900/50 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-amber-700 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="mt-4 w-full rounded-lg border border-dashed border-neutral-700 py-3 text-sm text-neutral-500 hover:border-neutral-500 hover:text-neutral-300 transition-colors"
      >
        + 添加问题
      </button>

      {/* 底部操作 */}
      <div className="mt-8 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg px-5 py-2.5 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !form.company.trim()}
          className="rounded-lg bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-white transition-colors disabled:opacity-40"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}
