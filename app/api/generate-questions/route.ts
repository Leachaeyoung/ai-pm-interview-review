import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { getInterviews } from '@/lib/data';

function buildSystemPrompt(company: string): string {
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

  return `你是一位资深的 AI 产品经理面试官。请基于职位描述为用户生成 6 道模拟面试题。

题目应该覆盖以下维度：
- AI技术理解
- 数据分析与指标体系
- 产品设计与用户体验
- 业务思维与商业化
- 项目管理与跨团队协作
- 行业趋势与竞品分析

生成规则：
- 优先参考同公司历史题目的风格和难度
- 至少 30% 的题目要是全新的（不在历史题库中）
- 题目应该贴近真实面试，有深度，能考察产品思维

${sameCompanySection}${generalSection}

请返回严格的 JSON 格式（不要包含 markdown 标记）：
{ "questions": ["题1", "题2", ...共6道...] }`;
}

export async function POST(request: NextRequest) {
  try {
    const { jd, company } = await request.json();

    if (!jd || typeof jd !== 'string') {
      return NextResponse.json({ error: '请提供职位描述' }, { status: 400 });
    }

    const system = buildSystemPrompt(company || '');
    const result = await callAI(system, jd);
    const parsed = JSON.parse(result);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
