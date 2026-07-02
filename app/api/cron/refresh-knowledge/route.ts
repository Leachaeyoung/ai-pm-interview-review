import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { getKnowledgeFeed, replaceKnowledgeFeed } from '@/lib/data';
import { v4 as uuid } from 'uuid';
import type { KnowledgeConcept, KnowledgeCategory } from '@/lib/types';

const VALID_CATEGORIES = new Set<string>([
  '大模型', '产品设计', '商业化', '开源工具', '行业政策', '技术架构', '应用案例',
]);

const SYSTEM_PROMPT = `你是一位资深 AI 产品经理兼行业趋势策展人。现在是 ${new Date().toISOString().slice(0, 10)}，请生成今天（2026 年 7 月）最值得 AI 产品经理关注的 12 条行业概念。

重要：请基于 2026 年年中的真实行业动态生成。包含具体的产品发布、模型更新、政策变化、商业化案例——而非泛泛的概念描述。

覆盖以下 7 个维度，每个维度至少 1 条：
- 大模型：新模型发布、能力突破、开源模型进展
- 产品设计：AI 产品交互创新、UX 范式变化
- 商业化：定价模式、营收数据、商业模式创新
- 开源工具：新框架、开发者工具、开源项目
- 行业政策：AI 监管法规、数据合规动态
- 技术架构：RAG/Agent/多模态架构演进
- 应用案例：标杆产品发布、竞品动态、增长案例

每条概念含：
1. title：概念名称（精炼，≤15字）
2. summary：一句话解释（≤30字）
3. category：分类
4. source：来源（公司名/媒体名，必须真实可查）
5. priority：优先级（"must-act" | "focus" | "aware"）
   - must-act：直接影响 AI PM 产品决策，本周需响应
   - focus：影响 1-3 个月规划
   - aware：长期趋势，保持关注
6. actionableInsight：1-2 句具体的行动建议（30-50字），回答"我作为 AI PM 应该做什么"

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

function deduplicateConcepts(
  existing: KnowledgeConcept[],
  incoming: Array<{
    title: string;
    summary: string;
    category: string;
    source: string;
    priority: string;
    actionableInsight: string;
  }>
): KnowledgeConcept[] {
  const existingTitles = new Set(
    existing.map((c) => c.title.toLowerCase().trim())
  );

  const now = new Date().toISOString();

  const fresh = incoming
    .filter((c) => {
      const normalized = c.title.toLowerCase().trim();
      // 精确匹配 + 包含关系去重
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
      category: (
        VALID_CATEGORIES.has(c.category) ? c.category : '大模型'
      ) as KnowledgeCategory,
      source: c.source || undefined,
      pushedAt: now,
      isNew: true,
      actionableInsight: c.actionableInsight || undefined,
      priority: (['must-act', 'focus', 'aware'].includes(c.priority)
        ? c.priority
        : 'aware') as KnowledgeConcept['priority'],
    }));

  return fresh;
}

export async function GET(request: NextRequest) {
  // 安全校验：通过 URL 参数或 Authorization header 验证 CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const urlSecret = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const providedSecret =
      authHeader?.replace(/^Bearer\s+/i, '') || urlSecret || '';
    if (providedSecret !== cronSecret) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
  }

  try {
    const existing = getKnowledgeFeed();

    const result = await callAI(
      SYSTEM_PROMPT,
      `现在是 ${new Date().toISOString().slice(0, 10)} 北京时间早上 9:00，请生成今天最值得 AI 产品经理关注的 12 条行业概念。要求具体、真实、有行动指导价值。`
    );

    // Strip markdown fences
    const cleaned = result
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '');

    const parsed = JSON.parse(cleaned);

    const freshConcepts = deduplicateConcepts(
      existing,
      parsed.concepts as Array<{
        title: string;
        summary: string;
        category: string;
        source: string;
        priority: string;
        actionableInsight: string;
      }>
    );

    if (freshConcepts.length === 0) {
      return NextResponse.json({
        ok: true,
        message: '无新概念（所有结果与已有数据重复）',
        count: 0,
      });
    }

    // 新卡片前置，保留最近的 50 条
    const merged = [...freshConcepts, ...existing].slice(0, 50);
    replaceKnowledgeFeed(merged);

    return NextResponse.json({
      ok: true,
      message: `成功刷新，新增 ${freshConcepts.length} 条概念`,
      count: freshConcepts.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('Cron refresh-knowledge failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
