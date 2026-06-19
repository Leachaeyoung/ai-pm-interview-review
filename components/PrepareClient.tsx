'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface JDAnalysis {
  requirements: string[];
  keywords: string[];
  businessDirection: string;
}

export default function PrepareClient() {
  const router = useRouter();
  const [jd, setJd] = useState('');
  const [company, setCompany] = useState('');
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<'parse' | 'generate' | null>(null);
  const [error, setError] = useState('');

  const handleParseJD = async () => {
    if (jd.trim().length < 50) {
      setError('职位描述太短，请至少输入50字');
      return;
    }
    setError('');
    setLoading('parse');
    try {
      const res = await fetch('/api/parse-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jd.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败');
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateQuestions = async () => {
    setError('');
    setLoading('generate');
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jd.trim(), company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuestions(data.questions);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setLoading(null);
    }
  };

  const handleStartMock = () => {
    sessionStorage.setItem('mockQuestions', JSON.stringify(questions));
    router.push('/prepare/mock');
  };

  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-xl font-bold text-white">面试前 · 模拟准备</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-900 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* JD 输入区 */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 mb-6">
        <label className="block text-sm font-medium text-neutral-300 mb-3">
          粘贴目标公司的职位描述 (JD)
        </label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="将公司招聘页面上的 JD 文本粘贴到这里..."
          rows={6}
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none resize-none"
        />
        <div className="mt-4 flex items-center gap-4">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="公司名（可选，用于匹配历史题目）"
            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
          />
          <button
            onClick={handleParseJD}
            disabled={loading === 'parse'}
            className="rounded-lg bg-neutral-700 px-5 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-600 transition-colors disabled:opacity-50"
          >
            {loading === 'parse' ? '解析中...' : '解析 JD'}
          </button>
        </div>
      </div>

      {/* JD 解析结果 */}
      {analysis && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 mb-6">
          <h2 className="text-sm font-semibold text-neutral-200 mb-4">JD 解析结果</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="text-xs font-medium text-neutral-500 mb-2">岗位核心要求</h3>
              <ul className="space-y-1">
                {analysis.requirements.map((r, i) => (
                  <li key={i} className="text-sm text-neutral-300">• {r}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-neutral-500 mb-2">关键词</h3>
              <div className="flex flex-wrap gap-1">
                {analysis.keywords.map((kw, i) => (
                  <span key={i} className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-medium text-neutral-500 mb-2">业务方向</h3>
              <p className="text-sm text-neutral-300">{analysis.businessDirection}</p>
            </div>
          </div>
          <button
            onClick={handleGenerateQuestions}
            disabled={loading === 'generate'}
            className="mt-5 rounded-lg bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading === 'generate' ? '生成中...' : '生成模拟题'}
          </button>
        </div>
      )}

      {/* 模拟题列表 */}
      {questions.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-neutral-200">
              模拟面试题 ({questions.length} 题)
            </h2>
            <button
              onClick={handleGenerateQuestions}
              disabled={loading === 'generate'}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {loading === 'generate' ? '重新生成中...' : '重新生成'}
            </button>
          </div>
          <ol className="space-y-3">
            {questions.map((q, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-200"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-400">
                  {i + 1}
                </span>
                {q}
              </li>
            ))}
          </ol>
          <button
            onClick={handleStartMock}
            className="mt-6 w-full rounded-lg bg-emerald-700 py-3 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
          >
            开始模拟面试 →
          </button>
        </div>
      )}
    </div>
  );
}
