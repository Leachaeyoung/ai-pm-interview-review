import { NextResponse } from 'next/server';
import { getNewKnowledgeCount } from '@/lib/data';

export async function GET() {
  const count = getNewKnowledgeCount();
  return NextResponse.json({ count });
}
