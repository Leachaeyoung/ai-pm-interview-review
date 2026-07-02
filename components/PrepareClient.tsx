'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ExamDimension {
  dimension: string;
  how: string;
}

interface Strategy {
  mustHit: string[];
  bonus: string[];
  avoid: string[];
}

interface JDAnalysis {
  requirements: string[];
  keywords: string[];
  businessDirection: string;
  implicitNeeds?: string[];
  teamStage?: string;
  topExamineDimensions?: ExamDimension[];
  strategy?: Strategy;
}

interface GeneratedQuestion {
  question: string;
  dimension?: string;
  followUpHint?: string;
}

export default function PrepareClient() {
  const router = useRouter();
  const [jd, setJd] = useState('');
  const [company, setCompany] = useState('');
  const [round, setRound] = useState('');
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState<'parse' | 'generate' | null>(null);
  const [error, setError] = useState('');

  const handleParseJD = async () => {
    if (jd.trim().length < 50) {
      setError('职位描述太短，请至少输入50字');
      return;
    }
    setError('');
    setQuestions([]);
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
        body: JSON.stringify({ jd: jd.trim(), company, round }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // 兼容新旧格式：新格式为 { question, dimension, followUpHint }[]
      const qs: GeneratedQuestion[] = data.questions.map(
        (q: string | GeneratedQuestion) =>
          typeof q === 'string' ? { question: q } : q
      );
      setQuestions(qs);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setLoading(null);
    }
  };

  const handleStartMock = () => {
    // 提取纯问题文本存入 sessionStorage（MockSession 兼容）
    const questionTexts = questions.map((q) => q.question);
    sessionStorage.setItem('mockQuestions', JSON.stringify(questionTexts));
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
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="公司名（可选）"
              className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
            />
            <select
              value={round}
              onChange={(e) => setRound(e.target.value)}
              className="w-full sm:w-44 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
            >
              <option value="">面试轮次（可选）</option>
              <option value="一面">一面</option>
              <option value="二面">二面</option>
              <option value="三面">三面</option>
              <option value="终面">终面</option>
              <option value="HR面">HR面</option>
            </select>
          </div>
          <button
            onClick={handleParseJD}
            disabled={loading === 'parse'}
            className="shrink-0 rounded-lg bg-neutral-700 px-5 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-600 transition-colors disabled:opacity-50"
          >
            {loading === 'parse' ? '解析中...' : '解析 JD'}
          </button>
        </div>
      </div>

      {/* JD 解析结果 */}
      {analysis && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-200">JD 解析结果</h2>

          {/* 关键词 — 横排标签 */}
          {analysis.keywords.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-500 shrink-0">🏷️</span>
              <div className="flex flex-wrap gap-1">
                {analysis.keywords.slice(0, 10).map((kw, i) => (
                  <span key={i} className="rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-300">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 核心要求 + 业务方向 — 单行 */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
            <span className="text-neutral-500 text-xs">核心要求</span>
            {analysis.requirements.slice(0, 5).map((r, i) => (
              <span key={i} className="text-neutral-300">· {r}</span>
            ))}
          </div>

          {/* 业务方向 + 团队阶段 — 单行 */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-xs text-neutral-400">
            <span>📍 {analysis.businessDirection}</span>
            {analysis.teamStage && <span>团队阶段：{analysis.teamStage}</span>}
          </div>

          {/* 隐性需求 — 单行 */}
          {analysis.implicitNeeds && analysis.implicitNeeds.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
              <span className="text-amber-400 shrink-0">⚠️ 隐性需求</span>
              {analysis.implicitNeeds.map((n, i) => (
                <span key={i} className="text-neutral-400">· {n}</span>
              ))}
            </div>
          )}

          {/* 考察维度 — 横排 */}
          {analysis.topExamineDimensions && analysis.topExamineDimensions.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs">
              <span className="text-sky-400 shrink-0">🎯 考察重点</span>
              {analysis.topExamineDimensions.map((d, i) => (
                <span key={i} className="text-neutral-300">
                  {d.dimension}<span className="text-neutral-500">（{d.how}）</span>
                </span>
              ))}
            </div>
          )}

          {/* 面试策略 — 最精简一行 */}
          {analysis.strategy && (
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-xs">
              {analysis.strategy.mustHit && analysis.strategy.mustHit.length > 0 && (
                <span>
                  <span className="text-red-400">🔴 必打：</span>
                  <span className="text-neutral-300">{analysis.strategy.mustHit.slice(0, 2).join('、')}</span>
                </span>
              )}
              {analysis.strategy.bonus && analysis.strategy.bonus.length > 0 && (
                <span>
                  <span className="text-amber-400">🟡 加分：</span>
                  <span className="text-neutral-300">{analysis.strategy.bonus.slice(0, 2).join('、')}</span>
                </span>
              )}
              {analysis.strategy.avoid && analysis.strategy.avoid.length > 0 && (
                <span>
                  <span className="text-neutral-500">🟢 避坑：</span>
                  <span className="text-neutral-400">{analysis.strategy.avoid.slice(0, 2).join('、')}</span>
                </span>
              )}
            </div>
          )}

          <button
            onClick={handleGenerateQuestions}
            disabled={loading === 'generate'}
            className="rounded-lg bg-neutral-100 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-white transition-colors disabled:opacity-50"
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
          <ol className="space-y-4">
            {questions.map((q, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs text-neutral-400 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-200 leading-relaxed">{q.question}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {q.dimension && (
                      <span className="rounded-md bg-sky-950/50 border border-sky-900/50 px-2 py-0.5 text-[11px] text-sky-300">
                        {q.dimension}
                      </span>
                    )}
                    {q.followUpHint && (
                      <span className="text-[11px] text-neutral-500">
                        💬 追问方向：{q.followUpHint}
                      </span>
                    )}
                  </div>
                </div>
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
