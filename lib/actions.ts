'use server';

import { revalidatePath } from 'next/cache';
import { addInterview, updateInterview, deleteInterview, updateProfile, replaceKnowledgeFeed, getKnowledgeFeed, markKnowledgeAsRead } from '@/lib/data';
import type { Interview, Profile, KnowledgeConcept, KnowledgeCategory } from '@/lib/types';
import { callAI } from '@/lib/ai';
import { v4 as uuid } from 'uuid';

export async function deleteInterviewAction(id: string): Promise<void> {
  deleteInterview(id);
  revalidatePath('/timeline');
}

export async function saveProfileAction(profile: Profile): Promise<void> {
  updateProfile(profile);
  revalidatePath('/profile');
}

export async function saveInterviewAction(
  initialData: Interview | undefined,
  formData: Omit<Interview, 'id' | 'createdAt'>
): Promise<void> {
  if (initialData) {
    updateInterview(initialData.id, formData);
  } else {
    addInterview(formData);
  }
  revalidatePath('/timeline');
}

// ---- Knowledge Feed ----

const KNOWLEDGE_SYSTEM_PROMPT = `你是一位资深 AI 产品经理兼行业趋势策展人。请生成 12 条当前最值得 AI 产品经理关注的行业概念。

覆盖以下 7 个维度（每个至少 1 条）：
- 大模型：新模型发布、能力突破、开源模型进展
- 产品设计：AI 产品交互创新、UX 范式变化
- 商业化：定价模式、营收数据、商业模式创新
- 开源工具：新框架、开发者工具、开源项目
- 行业政策：AI 监管法规、数据合规动态
- 技术架构：RAG/Agent/多模态架构演进
- 应用案例：标杆产品发布、竞品动态

每条概念包含：
1. title：概念名称（精炼，≤15字）
2. summary：一句话解释（≤30字）
3. category：对应上述 7 个维度之一
4. source：来源名称（公司名/媒体名），必须真实可查
5. priority：优先级（"must-act" | "focus" | "aware"）
   - must-act：直接影响 AI PM 产品决策，本周需响应
   - focus：影响 1-3 个月产品规划
   - aware：长期趋势，保持关注即可
6. actionableInsight：1-2 句具体的行动建议（30-50字）

请返回严格的 JSON 格式（不要包含 markdown 标记）：
{
  "concepts": [
    {
      "title": "...",
      "summary": "...",
      "category": "...",
      "source": "...",
      "priority": "must-act|focus|aware",
      "actionableInsight": "..."
    }
  ]
}`;

const VALID_CATEGORIES = new Set([
  '大模型', '产品设计', '商业化', '开源工具', '行业政策', '技术架构', '应用案例',
]);

const VALID_PRIORITIES = new Set(['must-act', 'focus', 'aware']);

function deduplicateConcepts(
  existing: KnowledgeConcept[],
  incoming: Array<{
    title: string;
    summary: string;
    category: string;
    source?: string;
    priority?: string;
    actionableInsight?: string;
  }>
): KnowledgeConcept[] {
  const existingTitles = new Set(
    existing.map((c) => c.title.toLowerCase().trim())
  );

  const now = new Date().toISOString();

  return incoming
    .filter((c) => {
      const normalized = c.title.toLowerCase().trim();
      const titles = Array.from(existingTitles);
      for (let i = 0; i < titles.length; i++) {
        if (
          normalized === titles[i] ||
          normalized.includes(titles[i]) ||
          titles[i].includes(normalized)
        ) {
          return false;
        }
      }
      return true;
    })
    .map((c): KnowledgeConcept => ({
      id: uuid(),
      title: c.title,
      summary: c.summary,
      category: VALID_CATEGORIES.has(c.category)
        ? (c.category as KnowledgeCategory)
        : '大模型',
      source: c.source || undefined,
      pushedAt: now,
      isNew: true,
      actionableInsight: c.actionableInsight || undefined,
      priority: VALID_PRIORITIES.has(c.priority || '')
        ? (c.priority as KnowledgeConcept['priority'])
        : 'aware',
    }));
}

export async function refreshKnowledgeAction(): Promise<KnowledgeConcept[]> {
  const existing = getKnowledgeFeed();

  const result = await callAI(
    KNOWLEDGE_SYSTEM_PROMPT,
    `现在是 ${new Date().toISOString().slice(0, 10)}，请生成当前最值得 AI 产品经理关注的 12 条行业概念。要求具体、真实、有行动指导价值。`
  );

  // Strip markdown fences if Claude wraps the JSON
  const cleaned = result.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  const parsed = JSON.parse(cleaned);

  const freshConcepts = deduplicateConcepts(
    existing,
    parsed.concepts as Array<{
      title: string;
      summary: string;
      category: string;
      source?: string;
      priority?: string;
      actionableInsight?: string;
    }>
  );

  // 新卡片前置，保留最近 50 条
  const merged = [...freshConcepts, ...existing].slice(0, 50);
  replaceKnowledgeFeed(merged);
  revalidatePath('/knowledge');

  return merged;
}

export async function markKnowledgeAsReadAction(): Promise<void> {
  markKnowledgeAsRead();
  revalidatePath('/knowledge');
}
