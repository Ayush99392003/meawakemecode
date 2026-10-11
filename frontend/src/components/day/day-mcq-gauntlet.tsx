'use client';

import * as React from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Cpu,
  Layers,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { McqQuestion } from '@/lib/data';
import { useProgressStore } from '@/lib/stores/progress-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DayMcqGauntletProps {
  dayNumber: number;
  dsaMcqs: McqQuestion[];
  csMcqs: McqQuestion[];
  systemDesignMcqs: McqQuestion[];
}

/** Circular SVG score ring shown in the gauntlet header */
function ScoreRing({
  correct,
  total,
  size = 56,
}: {
  correct: number;
  total: number;
  size?: number;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? correct / total : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={6}
          className="stroke-[rgb(var(--surface-raised))]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-700',
            pct >= 0.8
              ? 'stroke-emerald-400'
              : pct >= 0.5
              ? 'stroke-amber-400'
              : 'stroke-rose-400'
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-mono font-bold text-[rgb(var(--text-primary))] leading-none">
          {total > 0 ? Math.round(pct * 100) : 0}
        </span>
        <span className="text-[8px] text-[rgb(var(--text-muted))] font-mono leading-none">%acc</span>
      </div>
    </div>
  );
}

type Category = 'dsa' | 'cs_fundamentals' | 'system_design';

const CATEGORY_CONFIG: Record<
  Category,
  { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; color: string; border: string; bg: string; activeBorder: string }
> = {
  dsa: {
    label: 'DSA',
    shortLabel: 'DSA',
    icon: BookOpen,
    color: 'text-indigo-400',
    border: 'border-indigo-500',
    bg: 'bg-indigo-500/8',
    activeBorder: 'border-b-indigo-500',
  },
  cs_fundamentals: {
    label: 'CS Fund',
    shortLabel: 'CS',
    icon: Cpu,
    color: 'text-blue-400',
    border: 'border-blue-500',
    bg: 'bg-blue-500/8',
    activeBorder: 'border-b-blue-500',
  },
  system_design: {
    label: 'Sys Design',
    shortLabel: 'SD',
    icon: Layers,
    color: 'text-purple-400',
    border: 'border-purple-500',
    bg: 'bg-purple-500/8',
    activeBorder: 'border-b-purple-500',
  },
};

export function DayMcqGauntlet({
  dayNumber,
  dsaMcqs,
  csMcqs,
  systemDesignMcqs,
}: DayMcqGauntletProps) {
  const [activeCategory, setActiveCategory] = React.useState<Category>('dsa');
  const [currentIdx, setCurrentIdx] = React.useState(0);
  // Tracks a brief "correct!" flash animation
  const [flashCorrect, setFlashCorrect] = React.useState(false);

  const { mcqAnswers, saveMcqAnswer } = useProgressStore();

  const currentQuestions = React.useMemo(() => {
    if (activeCategory === 'dsa') return dsaMcqs;
    if (activeCategory === 'cs_fundamentals') return csMcqs;
    return systemDesignMcqs;
  }, [activeCategory, dsaMcqs, csMcqs, systemDesignMcqs]);

  React.useEffect(() => {
    setCurrentIdx(0);
  }, [activeCategory]);

  const activeQuestion: McqQuestion | undefined = currentQuestions[currentIdx];

  const getCategoryStats = (questions: McqQuestion[]) => {
    let answered = 0;
    let correct = 0;
    questions.forEach((q) => {
      const ans = mcqAnswers[q.id];
      if (ans) {
        answered++;
        if (ans === q.correctOption) correct++;
      }
    });
    return { answered, correct, total: questions.length };
  };

  const dsaStats = getCategoryStats(dsaMcqs);
  const csStats = getCategoryStats(csMcqs);
  const sdStats = getCategoryStats(systemDesignMcqs);

  const totalAnswered = dsaStats.answered + csStats.answered + sdStats.answered;
  const totalQuestions = dsaStats.total + csStats.total + sdStats.total;
  const totalCorrect = dsaStats.correct + csStats.correct + sdStats.correct;

  const currentAnswer = activeQuestion ? mcqAnswers[activeQuestion.id] : undefined;
  const hasAnsweredCurrent = !!currentAnswer;
  const isCurrentCorrect =
    hasAnsweredCurrent && currentAnswer === activeQuestion?.correctOption;

  const handleSelectOption = (key: string) => {
    if (!activeQuestion || hasAnsweredCurrent) return;
    saveMcqAnswer(activeQuestion.id, key);
    // Flash if correct
    if (key === activeQuestion.correctOption) {
      setFlashCorrect(true);
      setTimeout(() => setFlashCorrect(false), 600);
    }
    // Auto-advance after short delay
    setTimeout(() => {
      if (currentIdx < currentQuestions.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      }
    }, 900);
  };

  const catStats: Record<Category, ReturnType<typeof getCategoryStats>> = {
    dsa: dsaStats,
    cs_fundamentals: csStats,
    system_design: sdStats,
  };

  return (
    <div
      id="mcq-section"
      className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] overflow-hidden shadow-sm"
    >
      {/* ── Gauntlet Header ── */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-950/25 via-[rgb(var(--surface-raised))] to-emerald-950/20 border-b border-[rgb(var(--border))] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {/* Milestone badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-widest">
              05 / MCQ Gauntlet
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
              Daily Concept Gauntlet
            </span>
            <span className="text-[11px] text-[rgb(var(--text-muted))]">
              60 curated questions
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Day {dayNumber} Verification MCQs</span>
          </h3>
          <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">
            Lock in your mental model across DSA · CS Fundamentals · System Design.
          </p>
        </div>

        {/* Score Ring + counts */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="block text-xs font-mono font-bold text-[rgb(var(--text-primary))]">
              {totalAnswered}/{totalQuestions}
            </span>
            <span className="block text-[10px] font-mono text-emerald-400">
              {totalCorrect} correct
            </span>
          </div>
          <ScoreRing correct={totalCorrect} total={totalAnswered} size={52} />
        </div>
      </div>

      {/* ── 3 Category Tabs ── */}
      <div className="grid grid-cols-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))]">
        {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const stats = catStats[cat];
          const isActive = activeCategory === cat;
          const Icon = cfg.icon;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'relative py-3 px-2 sm:px-4 text-xs font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer border-b-2',
                isActive
                  ? cn(cfg.border, cfg.bg, cfg.color)
                  : 'border-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface))]'
              )}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={cn('w-3.5 h-3.5 shrink-0', isActive ? cfg.color : '')} />
                <span>{cfg.label}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono opacity-80">
                <span
                  className={cn(
                    'px-1 rounded',
                    stats.answered === stats.total && stats.total > 0
                      ? 'text-emerald-400'
                      : ''
                  )}
                >
                  {stats.answered}/{stats.total}
                </span>
                {stats.answered > 0 && (
                  <span className="text-[9px]">
                    ({Math.round((stats.correct / stats.answered) * 100)}%✓)
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Question Number Strip ── */}
      <div className="px-4 py-2.5 bg-[rgb(var(--surface)/0.5)] border-b border-[rgb(var(--border))] flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] font-mono text-[rgb(var(--text-muted))] mr-1 shrink-0">
            Jump:
          </span>
          {currentQuestions.map((q, idx) => {
            const ans = mcqAnswers[q.id];
            const isAnswered = !!ans;
            const isCorrect = isAnswered && ans === q.correctOption;
            const isActive = currentIdx === idx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={cn(
                  'w-6 h-6 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center shrink-0',
                  isActive && 'ring-2 ring-white scale-110 shadow-md z-10',
                  !isAnswered &&
                    'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface))]',
                  isAnswered &&
                    isCorrect &&
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
                  isAnswered &&
                    !isCorrect &&
                    'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                )}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="p-1 rounded border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-raised))] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-[rgb(var(--text-primary))] px-1">
            {currentIdx + 1}/{currentQuestions.length}
          </span>
          <button
            onClick={() =>
              setCurrentIdx((prev) => Math.min(currentQuestions.length - 1, prev + 1))
            }
            disabled={currentIdx === currentQuestions.length - 1}
            className="p-1 rounded border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-raised))] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Active Question View ── */}
      {activeQuestion ? (
        <div
          className={cn(
            'p-4 sm:p-6 space-y-5 transition-all duration-300',
            flashCorrect && 'bg-emerald-500/5'
          )}
        >
          {/* Question Metadata */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="px-2 py-0.5 rounded font-mono font-semibold bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border))]">
                Q{currentIdx + 1} of {currentQuestions.length}
              </span>
              <span className="font-mono text-[rgb(var(--text-muted))]">{activeQuestion.topic}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase',
                  activeQuestion.difficulty === 'easy' && 'bg-emerald-500/10 text-emerald-400',
                  activeQuestion.difficulty === 'medium' && 'bg-amber-500/10 text-amber-400',
                  activeQuestion.difficulty === 'hard' && 'bg-rose-500/10 text-rose-400'
                )}
              >
                {activeQuestion.difficulty}
              </span>
              {flashCorrect && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 animate-bounce">
                  <Zap className="w-3 h-3" />
                  Correct!
                </span>
              )}
            </div>

            <h4 className="text-sm sm:text-base font-bold text-[rgb(var(--text-primary))] leading-snug">
              {activeQuestion.question}
            </h4>

            {activeQuestion.codeSnippet && (
              <div className="my-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] p-3 overflow-x-auto">
                <pre className="font-mono text-xs text-[rgb(var(--text-primary))]">
                  <code>{activeQuestion.codeSnippet}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-2.5">
            {activeQuestion.options.map((opt) => {
              const isSelected = currentAnswer === opt.key;
              const isOptionCorrect = activeQuestion.correctOption === opt.key;

              let cardStyle =
                'bg-[rgb(var(--surface))] border-[rgb(var(--border))] hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))]';

              if (hasAnsweredCurrent) {
                if (isOptionCorrect) {
                  cardStyle = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-100 shadow-sm shadow-emerald-500/10';
                } else if (isSelected) {
                  cardStyle = 'bg-rose-500/10 border-rose-500/50 text-rose-100 shadow-sm';
                } else {
                  cardStyle = 'bg-[rgb(var(--surface-raised)/0.4)] border-[rgb(var(--border))] opacity-55 text-[rgb(var(--text-muted))]';
                }
              }

              return (
                <button
                  key={opt.key}
                  onClick={() => handleSelectOption(opt.key)}
                  disabled={hasAnsweredCurrent}
                  className={cn(
                    'w-full text-left p-3 sm:p-3.5 rounded-[var(--radius-md)] border text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default',
                    cardStyle
                  )}
                >
                  <span
                    className={cn(
                      'w-6 h-6 rounded-md font-mono font-bold flex items-center justify-center shrink-0 text-xs border transition-all',
                      isSelected
                        ? isOptionCorrect
                          ? 'bg-emerald-500 text-white border-emerald-400 scale-110'
                          : 'bg-rose-500 text-white border-rose-400'
                        : isOptionCorrect && hasAnsweredCurrent
                        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                        : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-primary))] border-[rgb(var(--border))]'
                    )}
                  >
                    {opt.key}
                  </span>
                  <span className="flex-1 leading-relaxed">{opt.text}</span>
                  {hasAnsweredCurrent && (
                    <span className="shrink-0 pt-0.5">
                      {isOptionCorrect ? (
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

          {/* Explanation box */}
          {hasAnsweredCurrent && (
            <div
              className={cn(
                'p-4 rounded-[var(--radius-md)] border text-xs sm:text-sm space-y-1.5 transition-all animate-fadeIn',
                isCurrentCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-100'
              )}
            >
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                {isCurrentCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Correct</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-300">
                      Incorrect · Correct: {activeQuestion.correctOption}
                    </span>
                  </>
                )}
              </div>
              <p className="leading-relaxed opacity-95">{activeQuestion.detailedExplanation}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[rgb(var(--border))]">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <span className="text-xs text-[rgb(var(--text-muted))] font-mono">
              {currentIdx + 1} / {currentQuestions.length}
            </span>

            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                setCurrentIdx((prev) => Math.min(currentQuestions.length - 1, prev + 1))
              }
              disabled={currentIdx === currentQuestions.length - 1}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-[rgb(var(--text-muted))]">
          No questions found for this category.
        </div>
      )}

      {/* Summary footer when all answered */}
      {totalAnswered === totalQuestions && totalQuestions > 0 && (
        <div className="p-4 border-t border-[rgb(var(--border))] bg-gradient-to-r from-emerald-950/20 to-teal-950/20 flex items-center justify-center gap-3">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-sm font-bold text-[rgb(var(--text-primary))]">
            Gauntlet Complete! {totalCorrect}/{totalQuestions} Correct
            {totalQuestions > 0 && ` (${Math.round((totalCorrect / totalQuestions) * 100)}% accuracy)`}
          </span>
          <Target className="w-4 h-4 text-emerald-400" />
        </div>
      )}
    </div>
  );
}
