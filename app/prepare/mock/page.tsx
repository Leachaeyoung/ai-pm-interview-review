'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MockSession from '@/components/MockSession';
import { saveInterviewAction } from '@/lib/actions';

export default function MockPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('mockQuestions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuestions(parsed);
        }
      } catch {}
    }
    setLoaded(true);
  }, []);

  const handleComplete = async (
    answers: Array<{ question: string; answer: string }>
  ) => {
    await saveInterviewAction(undefined, {
      company: '',
      position: '',
      date: new Date().toISOString().slice(0, 10),
      round: '模拟面试',
      questions: answers.map((a) => ({
        id: crypto.randomUUID(),
        question: a.question,
        answer: a.answer,
        reflection: '',
      })),
    });
    sessionStorage.removeItem('mockQuestions');
    router.push('/timeline');
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-neutral-500">
        加载中...
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-500">
        <p>没有模拟题目。请先在面试前页面生成题目。</p>
        <button
          onClick={() => router.push('/prepare')}
          className="mt-4 text-sm text-neutral-400 hover:text-white underline"
        >
          返回面试前
        </button>
      </div>
    );
  }

  return (
    <MockSession
      questions={questions}
      onComplete={handleComplete}
      onExit={() => router.push('/prepare')}
    />
  );
}
