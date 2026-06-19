import { NextRequest, NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

const SYSTEM_PROMPT = `你是一位资深的 AI 产品经理面试官。你的任务是分析用户提供的职位描述(JD)，提取关键信息。

请返回严格的 JSON 格式（不要包含 markdown 标记）：
{
  "requirements": ["核心要求1", "核心要求2", ...],
  "keywords": ["关键词1", "关键词2", ...],
  "businessDirection": "该公司在JD中体现的业务方向"
}`;

export async function POST(request: NextRequest) {
  try {
    const { jd } = await request.json();

    if (!jd || typeof jd !== 'string' || jd.trim().length < 50) {
      return NextResponse.json(
        { error: '请提供完整的职位描述（至少50字）' },
        { status: 400 }
      );
    }

    const result = await callAI(SYSTEM_PROMPT, jd.trim());
    const parsed = JSON.parse(result);

    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
