import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { getInterviews } from '@/lib/data';

function buildSystemPrompt(company: string, round: string): string {
  const allInterviews = getInterviews();

  // 提取同公司的历史真题
  const sameCompany = allInterviews
    .filter((i) => i.company === company)
    .flatMap((i) => i.questions.map((q) => q.question));

  // 提取所有历史真题
  const allQuestions = allInterviews.flatMap((i) =>
    i.questions.map((q) => q.question)
  );

  let sameCompanySection = '';
  if (sameCompany.length > 0) {
    sameCompanySection = `\n\n该公司历史真实面试题（请参考风格和难度，生成变体题）：\n${sameCompany.slice(0, 10).map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
  }

  const generalSection = allQuestions.length > 0
    ? `\n\n该用户所有历史面试题（避免超过70%重复）：\n${allQuestions.slice(0, 20).map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  // 轮次梯度说明
  const roundGuidance: Record<string, string> = {
    '一面': '一面通常由同级或高一级 PM 面试，重点考察基础认知和执行力。题目应侧重：项目深挖、case study、基础方法论。',
    '二面': '二面通常由直属 leader 面试，重点考察深度思考能力和产品 sense。题目应侧重：开放题、trade-off 分析、逆向思维。',
    '三面': '三面通常由交叉面或总监面试，重点考察战略视野和跨领域能力。题目应侧重：行业判断、从 0 到 1、组织协同。',
    '终面': '终面通常由 VP 或合伙人面试，重点考察文化匹配度和长期潜力。题目应侧重：价值观、驱动力、自我认知。',
    'HR面': 'HR 面重点考察软素质和职业规划。题目应侧重：冲突处理、成长路径、薪酬预期。',
  };

  const roundNote = roundGuidance[round] || '';

  return `你是一位资深 AI 产品经理面试官，在头部 AI 公司担任面试委员会成员。请基于职位描述和面试轮次，为用户生成 6 道模拟面试题。

当前面试轮次：${round || '未知'}
${roundNote}

题目应覆盖以下 AI PM 特有考察维度：
- AI技术理解：模型选型、技术可行性评估、模型能力边界判断
- 数据分析与指标体系：数据飞轮设计、AI 产品指标、A/B 实验
- 产品设计与用户体验：AI 交互范式、提示词工程、Agent 设计
- 业务思维与商业化：AI 产品定价、商业化路径、ROI 量化
- 项目管理与跨团队协作：与算法团队协作、模型迭代节奏
- 行业趋势与竞品分析：开源 vs 闭源、行业格局判断

生成规则：
- 按面试轮次梯度设计题目难度
- 优先参考同公司历史题目的风格和难度
- 至少 30% 的题目要是全新的（不在历史题库中）
- 题目应贴近真实面试，有深度，能考察产品思维
- 每道题附带追问方向（1-2 句话），帮用户准备追问应对

${sameCompanySection}${generalSection}

请返回严格的 JSON 格式（不要包含 markdown 标记）：
{
  "questions": [
    {
      "question": "面试题目",
      "dimension": "考察维度（AI技术理解/数据分析与指标体系/产品设计与用户体验/业务思维与商业化/项目管理与跨团队协作/行业趋势与竞品分析）",
      "followUpHint": "面试官可能的追问方向"
    }
  ]
}`;
}

export async function POST(request: NextRequest) {
  try {
    const { jd, company, round } = await request.json();

    if (!jd || typeof jd !== 'string') {
      return NextResponse.json({ error: '请提供职位描述' }, { status: 400 });
    }

    const system = buildSystemPrompt(company || '', round || '');
    const result = await callAI(system, jd);

    // Strip markdown fences
    const cleaned = result
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '');
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
