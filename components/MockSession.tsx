'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInput from './VoiceInput';

interface MockSessionProps {
  questions: string[];
  onComplete: (answers: Array<{ question: string; answer: string }>) => void;
  onExit: () => void;
}

const THINK_TIME = 60; // seconds

export default function MockSession({ questions, onComplete, onExit }: MockSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'thinking' | 'answering'>('thinking');
  const [thinkTimeLeft, setThinkTimeLeft] = useState(THINK_TIME);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<Array<{ question: string; answer: string }>>([]);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 总计时
  useEffect(() => {
    totalTimerRef.current = setInterval(() => {
      setTotalElapsed((t) => t + 1);
    }, 1000);
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, []);

  // 思考倒计时
  useEffect(() => {
    if (phase !== 'thinking') return;
    setThinkTimeLeft(THINK_TIME);
    timerRef.current = setInterval(() => {
      setThinkTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('answering');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentIndex]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timerColor = (time: number, total: number): string => {
    const ratio = time / total;
    if (ratio > 0.5) return 'text-emerald-400';
    if (ratio > 0.2) return 'text-amber-400';
    return 'text-red-400';
  };

  const handleNext = useCallback(() => {
    setAnswers((prev) => [...prev, { question: questions[currentIndex], answer: currentAnswer }]);
    setCurrentAnswer('');

    if (currentIndex + 1 >= questions.length) {
      setIsCompleted(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setPhase('thinking');
    }
  }, [currentIndex, currentAnswer, questions]);

  const handleComplete = () => {
    const finalAnswers = [
      ...answers,
      { question: questions[currentIndex], answer: currentAnswer },
    ];
    onComplete(finalAnswers);
  };

  // 完成页面
  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="mb-6 text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-3">模拟面试完成</h2>
          <p className="text-neutral-400">
            用时 {formatTime(totalElapsed)} · 共 {questions.length} 题
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={onExit}
              className="rounded-lg border border-neutral-700 px-6 py-3 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              返回
            </button>
            <button
              onClick={handleComplete}
              className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              保存并复盘
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="flex flex-col min-h-[80vh]">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-8">
        <button
          onClick={onExit}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ← 退出模拟
        </button>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-neutral-400">
            第 {currentIndex + 1}/{questions.length} 题
          </span>
          <span className={`font-mono ${timerColor(totalElapsed, 1800)}`}>
            ⏱ {formatTime(totalElapsed)}
          </span>
        </div>
      </div>

      {/* 题目显示 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, rotateX: 90 }}
          animate={{ opacity: 1, rotateX: 0 }}
          exit={{ opacity: 0, rotateX: -90 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col"
        >
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 mb-6">
            <p className="text-lg leading-relaxed text-neutral-100">{currentQuestion}</p>
          </div>

          {/* 思考阶段 */}
          {phase === 'thinking' && (
            <div className="flex items-center justify-center gap-4 py-6">
              <div className="text-center">
                <p className="text-sm text-neutral-500 mb-2">思考时间</p>
                <p className={`text-3xl font-mono font-bold ${timerColor(thinkTimeLeft, THINK_TIME)}`}>
                  {formatTime(thinkTimeLeft)}
                </p>
              </div>
              <button
                onClick={() => setPhase('answering')}
                className="rounded-lg bg-neutral-800 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                跳过思考 →
              </button>
            </div>
          )}

          {/* 回答阶段 */}
          {phase === 'answering' && (
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-neutral-400">你的回答</label>
                <VoiceInput onTextChange={setCurrentAnswer} text={currentAnswer} />
              </div>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="输入你的回答思路，或使用语音输入..."
                rows={8}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-4 text-sm text-neutral-100 placeholder-neutral-600 focus:border-neutral-500 focus:outline-none resize-none"
                autoFocus
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleNext}
                  className="rounded-lg bg-neutral-100 px-6 py-2.5 text-sm font-medium text-neutral-900 hover:bg-white transition-colors"
                >
                  下一题 →
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
