'use client';

import { useState } from 'react';
import { saveProfileAction } from '@/lib/actions';
import SkillRadar from '@/components/SkillRadar';
import type { Profile } from '@/lib/types';

export default function ProfileClient({ profile: initial }: { profile: Profile }) {
  const [profile, setProfile] = useState<Profile>(initial);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveProfileAction(profile);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateScore = (dimension: string, score: number) => {
    setProfile((prev) => ({
      ...prev,
      selfAssessment: prev.selfAssessment.map((a) =>
        a.dimension === dimension ? { ...a, score } : a
      ),
    }));
  };

  const toggleWeakPoint = (point: string) => {
    setProfile((prev) => ({
      ...prev,
      weakPoints: prev.weakPoints.includes(point)
        ? prev.weakPoints.filter((p) => p !== point)
        : [...prev.weakPoints, point],
    }));
  };

  const addCustomWeakPoint = (point: string) => {
    if (!point.trim()) return;
    setProfile((prev) => ({
      ...prev,
      weakPoints: [...prev.weakPoints, point.trim()],
    }));
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-white">我的 · 能力总结</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-400">已保存 ✓</span>}
          {editing ? (
            <button
              onClick={handleSave}
              className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white transition-colors"
            >
              保存
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              编辑
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* 左侧：技能雷达图 */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-sm font-semibold text-neutral-200 mb-6">能力雷达</h2>
          <div className="flex justify-center">
            <SkillRadar data={profile.selfAssessment} />
          </div>
          {editing && (
            <div className="mt-6 space-y-3">
              {profile.selfAssessment.map((item) => (
                <div key={item.dimension} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-neutral-400">{item.dimension}</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={item.score}
                    onChange={(e) => updateScore(item.dimension, parseInt(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="w-6 text-right text-xs text-neutral-300">{item.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：薄弱环节 + 建议 */}
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-sm font-semibold text-neutral-200 mb-4">薄弱环节</h2>
            {editing ? (
              <div className="space-y-2">
                {profile.weakPoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-neutral-300 rounded-lg bg-neutral-800 px-3 py-2">
                      {point}
                    </span>
                    <button
                      onClick={() => toggleWeakPoint(point)}
                      className="text-xs text-neutral-500 hover:text-red-400 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder="+ 添加薄弱环节"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addCustomWeakPoint((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="w-full rounded-lg border border-dashed border-neutral-700 bg-transparent px-3 py-2 text-sm text-neutral-300 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none"
                />
              </div>
            ) : (
              <ul className="space-y-2">
                {profile.weakPoints.map((point, i) => (
                  <li key={i} className="text-sm text-neutral-400">• {point}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-sm font-semibold text-neutral-200 mb-4">总体建议</h2>
            {editing ? (
              <textarea
                value={profile.recommendations}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, recommendations: e.target.value }))
                }
                rows={4}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none resize-none"
              />
            ) : (
              <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">
                {profile.recommendations}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 学习资源 */}
      <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-sm font-semibold text-neutral-200 mb-4">推荐学习资源</h2>
        <div className="grid grid-cols-3 gap-4">
          {profile.resources.map((res, i) => (
            <a
              key={i}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 hover:border-neutral-600 transition-colors"
            >
              <span className="text-xs text-neutral-500 uppercase">{res.type}</span>
              <p className="mt-1 text-sm font-medium text-neutral-200">{res.title}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
