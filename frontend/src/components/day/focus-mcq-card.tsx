'use client';

import * as React from 'react';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Cpu,
  Layers,
  Zap,
  Trophy,
} from 'lucide-react';
import { McqQuestion } from '@/lib/data';
import { useProgressStore } from '@/lib/stores/progress-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FocusMcqCardProps {
  dayNumber: number;
  dsaMcqs: McqQuestion[];
  csMcqs: McqQuestion[];
  systemDesignMcqs: McqQuestion[];
}

type FocusCategory = 'dsa' | 'cs' | 'sd';

const CAT_CONFIG: Record<FocusCategory, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeBg: string;
  progressColor: string;
}> = {
  dsa: {
    label: 'DSA',
    icon: BookOpen,
    color: 'text-indigo-400',
    activeBg: 'bg-indigo-500/15 border-indigo-500/40',
    progressColor: '#6366f1',
  },
  cs: {
    label: 'CS Fund',
    icon: Cpu,
    color: 'text-blue-400',
    activeBg: 'bg-blue-500/15 border-blue-500/40',
    progressColor: '#3b82f6',
  },
  sd: {
    label: 'Sys Design',
    icon: Layers,
    color: 'text-purple-400',
    activeBg: 'bg-purple-500/15 border-purple-500/40',
    progressColor: '#a855f7',
  },
};

export function FocusMcqCard({ dayNumber, dsaMcqs, csMcqs, systemDesignMcqs }: FocusMcqCardProps) {
  const [category, setCategory] = React.useState<FocusCategory>('dsa');
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [animKey, setAnimKey] = React.useState(0);

  const { mcqAnswers, saveMcqAnswer } = useProgressStore();

  const questions = category === 'dsa' ? dsaMcqs : category === 'cs' ? csMcqs : systemDesignMcqs;
  const question = questions[currentIdx];
  const currentAnswer = question ? mcqAnswers[question.id] : undefined;
  const hasAnswered = !!currentAnswer;
  const isCorrect = hasAnswered && currentAnswer === question?.correctOption;

  // Keyboard shortcuts: A/B/C/D select, →/Enter advance, ←/Backspace go back, Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!question) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (!hasAnswered && ['a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(e.key)) {
        const key = e.key.toUpperCase();
        const opt = question.options.find((o) => o.key === key);
        if (opt) handleSelect(key);
      } else if ((e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') && hasAnswered) {
        e.preventDefault();
        advanceQuestion();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, hasAnswered, currentIdx]);

  const handleSelect = (key: string) => {
    if (!question || hasAnswered) return;
    saveMcqAnswer(question.id, key);
  };

  const advanceQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((p) => p + 1);
      setAnimKey((k) => k + 1);
    }
  };

  const goBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx((p) => p - 1);
      setAnimKey((k) => k + 1);
    }
  };

  const switchCategory = (cat: FocusCategory) => {
    setCategory(cat);
    setCurrentIdx(0);
    setAnimKey((k) => k + 1);
  };

  // Per-category stats
  const getCatStats = (qs: McqQuestion[]) => {
    let answered = 0, correct = 0;
    qs.forEach((q) => {
      const a = mcqAnswers[q.id];
      if (a) { answered++; if (a === q.correctOption) correct++; }
    });
    return { answered, correct, total: qs.length };
  };
  const stats = { dsa: getCatStats(dsaMcqs), cs: getCatStats(csMcqs), sd: getCatStats(systemDesignMcqs) };
  const curStats = stats[category];
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  if (!question) {
    return (
      <div className="p-8 text-center text-sm text-[rgb(var(--text-muted))] rounded-2xl border border-dashed border-[rgb(var(--border))]">
        No questions in this category.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Category Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))]">
        {(Object.keys(CAT_CONFIG) as FocusCategory[]).map((cat) => {
          const cfg = CAT_CONFIG[cat];
          const st = stats[cat];
          const isActive = category === cat;
          const Icon = cfg.icon;
          const allDone = st.answered === st.total && st.total > 0;
          return (
            <button
              key={cat}
              onClick={() => switchCategory(cat)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                isActive
                  ? cn('border', cfg.activeBg, cfg.color)
                  : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface))]'
              )}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={cn('w-3.5 h-3.5 shrink-0', isActive ? cfg.color : '')} />
                <span>{cfg.label}</span>
              </div>
              <span className={cn('text-[10px] font-mono', allDone ? 'text-emerald-400' : '')}>
                {st.answered}/{st.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress bar + counter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className={cn('font-semibold', CAT_CONFIG[category].color)}>
            Question {currentIdx + 1} / {questions.length}
          </span>
          <span className="text-[rgb(var(--text-muted))]">
            {curStats.answered} answered · {curStats.correct} correct
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[rgb(var(--surface-raised))] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: CAT_CONFIG[category].progressColor }}
          />
        </div>
      </div>

      {/* Question Card — animated on change */}
      <div
        key={animKey}
        className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] overflow-hidden shadow-sm animate-fadeIn"
      >
        {/* Question meta */}
        <div className="px-5 pt-5 pb-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="px-2 py-0.5 rounded font-mono font-semibold bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border))]">
              Q{currentIdx + 1}
            </span>
            {question.topic && (
              <span className="font-mono text-[rgb(var(--text-muted))]">{question.topic}</span>
            )}
            <span
              className={cn(
                'px-1.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase',
                question.difficulty === 'easy' && 'bg-emerald-500/10 text-emerald-400',
                question.difficulty === 'medium' && 'bg-amber-500/10 text-amber-400',
                question.difficulty === 'hard' && 'bg-rose-500/10 text-rose-400'
              )}
            >
              {question.difficulty}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[rgb(var(--text-primary))] leading-snug">
            {question.question}
          </h3>

          {question.codeSnippet && (
            <pre className="p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] font-mono text-xs text-[rgb(var(--text-primary))] overflow-x-auto leading-relaxed">
              <code>{question.codeSnippet}</code>
            </pre>
          )}
        </div>

        {/* Options */}
        <div className="px-5 pb-5 space-y-2.5">
          {question.options.map((opt) => {
            const isSelected = currentAnswer === opt.key;
            const isOptCorrect = question.correctOption === opt.key;

            let cardCls = 'bg-[rgb(var(--surface))] border-[rgb(var(--border))] hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))]';
            if (hasAnswered) {
              if (isOptCorrect) cardCls = 'bg-emerald-500/12 border-emerald-500/50 text-emerald-100 shadow-sm shadow-emerald-500/10';
              else if (isSelected) cardCls = 'bg-rose-500/12 border-rose-500/50 text-rose-100';
              else cardCls = 'bg-[rgb(var(--surface-raised)/0.4)] border-[rgb(var(--border))] opacity-50 text-[rgb(var(--text-muted))]';
            }

            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                disabled={hasAnswered}
                className={cn(
                  'w-full text-left p-3.5 sm:p-4 rounded-xl border text-sm font-medium transition-all flex items-start gap-3.5 cursor-pointer disabled:cursor-default',
                  cardCls
                )}
              >
                <span
                  className={cn(
                    'w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 border transition-all',
                    isSelected
                      ? isOptCorrect
                        ? 'bg-emerald-500 text-white border-emerald-400 scale-110'
                        : 'bg-rose-500 text-white border-rose-400'
                      : isOptCorrect && hasAnswered
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                      : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-primary))] border-[rgb(var(--border))]'
                  )}
                >
                  {opt.key}
                </span>
                <span className="flex-1 leading-relaxed">{opt.text}</span>
                {hasAnswered && (
                  <span className="shrink-0 pt-0.5">
                    {isOptCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isSelected ? (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    ) : null}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Keyboard hint */}
        {!hasAnswered && (
          <div className="px-5 pb-4 flex items-center gap-2 text-[10px] text-[rgb(var(--text-muted))] font-mono">
            <Zap className="w-3 h-3 shrink-0" />
            Press <kbd className="px-1 py-0.5 rounded bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))]">A</kbd>
            <kbd className="px-1 py-0.5 rounded bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))]">B</kbd>
            <kbd className="px-1 py-0.5 rounded bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))]">C</kbd>
            <kbd className="px-1 py-0.5 rounded bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))]">D</kbd> to select
          </div>
        )}

        {/* Explanation reveal */}
        {hasAnswered && (
          <div
            className={cn(
              'mx-5 mb-5 p-4 rounded-xl border text-sm space-y-1.5 animate-fadeIn',
              isCorrect
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-100'
            )}
          >
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-300">
                    Incorrect · Correct answer: {question.correctOption}
                  </span>
                </>
              )}
            </div>
            <p className="leading-relaxed opacity-95">{question.detailedExplanation}</p>
            <p className="text-[10px] font-mono opacity-60 pt-1">
              Press <kbd className="px-1 py-0.5 rounded bg-black/20 border border-white/10">→</kbd> or{' '}
              <kbd className="px-1 py-0.5 rounded bg-black/20 border border-white/10">Enter</kbd> for next
            </p>
          </div>
        )}
      </div>

      {/* Nav bar */}
      <div className="flex items-center justify-between">
        <Button size="sm" variant="secondary" onClick={goBack} disabled={currentIdx === 0}>
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        {currentIdx === questions.length - 1 && curStats.answered === curStats.total ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--success))]">
            <Trophy className="w-4 h-4" />
            <span>Category Complete!</span>
          </div>
        ) : (
          <span className="text-[11px] font-mono text-[rgb(var(--text-muted))]">
            {currentIdx + 1} / {questions.length}
          </span>
        )}

        {currentIdx === questions.length - 1 ? (
          category === 'dsa' ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => switchCategory('cs')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 font-bold"
            >
              <span>Next Category: CS Fund</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : category === 'cs' ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => switchCategory('sd')}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 font-bold"
            >
              <span>Next Category: Sys Design</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>All MCQs Done!</span>
            </div>
          )
        ) : (
          <Button
            size="sm"
            variant="primary"
            onClick={advanceQuestion}
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
