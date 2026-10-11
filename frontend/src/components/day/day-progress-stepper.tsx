'use client';

import * as React from 'react';
import {
  BookOpen,
  Cpu,
  Layers,
  Code2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayProgressStepperProps {
  dayNumber: number;
  dsaTheoryRead: boolean;
  csTheoryRead: boolean;
  systemDesignRead: boolean;
  solvedCount: number;
  totalProblems?: number;
  mcqAnsweredCount: number;
  totalMcqs?: number;
  onJumpToSection?: (sectionId: string) => void;
}

const STEP_COLORS = [
  {
    accent: 'text-indigo-400',
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/40',
    ring: 'ring-indigo-500/30',
    glow: 'shadow-indigo-500/20',
    dot: 'bg-indigo-400',
    line: 'from-indigo-500/60 to-blue-500/60',
  },
  {
    accent: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/40',
    ring: 'ring-blue-500/30',
    glow: 'shadow-blue-500/20',
    dot: 'bg-blue-400',
    line: 'from-blue-500/60 to-purple-500/60',
  },
  {
    accent: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    ring: 'ring-purple-500/30',
    glow: 'shadow-purple-500/20',
    dot: 'bg-purple-400',
    line: 'from-purple-500/60 to-orange-500/60',
  },
  {
    accent: 'text-orange-400',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/40',
    ring: 'ring-orange-500/30',
    glow: 'shadow-orange-500/20',
    dot: 'bg-orange-400',
    line: 'from-orange-500/60 to-emerald-500/60',
  },
  {
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    ring: 'ring-emerald-500/30',
    glow: 'shadow-emerald-500/20',
    dot: 'bg-emerald-400',
    line: '',
  },
];

export function DayProgressStepper({
  dayNumber,
  dsaTheoryRead,
  csTheoryRead,
  systemDesignRead,
  solvedCount,
  totalProblems = 5,
  mcqAnsweredCount,
  totalMcqs = 60,
  onJumpToSection,
}: DayProgressStepperProps) {
  const problemsComplete = solvedCount >= totalProblems;
  const mcqsComplete = mcqAnsweredCount >= Math.min(15, totalMcqs);

  const steps = [
    {
      id: 'dsa-theory',
      label: 'DSA Theory',
      shortLabel: 'DSA',
      icon: BookOpen,
      completed: dsaTheoryRead,
      detail: dsaTheoryRead ? 'Read & Mastered' : 'Read the theory',
    },
    {
      id: 'cs-fundamentals',
      label: 'CS Fundamentals',
      shortLabel: 'CS Fund',
      icon: Cpu,
      completed: csTheoryRead,
      detail: csTheoryRead ? 'Concepts Mastered' : 'Core CS concepts',
    },
    {
      id: 'system-design',
      label: 'System Design',
      shortLabel: 'Sys Design',
      icon: Layers,
      completed: systemDesignRead,
      detail: systemDesignRead ? 'Architecture Done' : 'Scale & architecture',
    },
    {
      id: 'problems-section',
      label: '5 Problems',
      shortLabel: 'Problems',
      icon: Code2,
      completed: problemsComplete,
      detail: `${solvedCount}/${totalProblems} Solved`,
    },
    {
      id: 'mcq-section',
      label: 'Daily MCQs',
      shortLabel: 'MCQs',
      icon: HelpCircle,
      completed: mcqsComplete,
      detail: `${mcqAnsweredCount}/${totalMcqs} Done`,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  // Which step is the current active one (first incomplete)
  const activeIdx = steps.findIndex((s) => !s.completed);

  const handleClick = (sectionId: string) => {
    if (onJumpToSection) {
      onJumpToSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-gradient-to-b from-[rgb(var(--surface-raised)/0.6)] to-[rgb(var(--surface)/0.95)] overflow-hidden shadow-sm">
      {/* Top Header */}
      <div className="px-4 sm:px-5 pt-4 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgb(var(--border))]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--accent)/0.15)] text-[rgb(var(--accent))] flex items-center justify-center font-bold text-xs border border-[rgb(var(--accent)/0.2)] shrink-0">
            {dayNumber}
          </div>
          <div>
            <h2 className="text-sm font-bold text-[rgb(var(--text-primary))] flex items-center gap-1.5">
              Day {dayNumber} · Learning Path
              {percentage === 100 && (
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              )}
            </h2>
            <p className="text-[11px] text-[rgb(var(--text-muted))]">
              Click any milestone to jump directly to that section
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[rgb(var(--text-primary))]">
              {completedCount}/{steps.length} done
            </span>
            <span className="block text-[10px] text-[rgb(var(--text-muted))]">
              {percentage}% complete
            </span>
          </div>
          {/* Wide animated progress bar */}
          <div className="w-20 h-2 rounded-full bg-[rgb(var(--surface-raised))] overflow-hidden border border-[rgb(var(--border))]">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                percentage === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-[rgb(var(--accent))] to-indigo-400'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Horizontal Stepper — desktop */}
      <div className="hidden sm:block px-5 py-4">
        <div className="relative flex items-start">
          {steps.map((step, idx) => {
            const color = STEP_COLORS[idx];
            const Icon = step.icon;
            const isComplete = step.completed;
            const isActive = idx === activeIdx;
            const isPast = idx < activeIdx || (activeIdx === -1 && isComplete);
            const isFuture = !isComplete && idx > activeIdx && activeIdx !== -1;

            return (
              <React.Fragment key={step.id}>
                {/* Step node */}
                <button
                  onClick={() => handleClick(step.id)}
                  className={cn(
                    'group relative flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 flex-1 min-w-0',
                    'focus:outline-none'
                  )}
                >
                  {/* Circle */}
                  <div
                    className={cn(
                      'relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                      isComplete
                        ? 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/20'
                        : isActive
                        ? cn(
                            color.bg,
                            color.border,
                            'shadow-lg',
                            color.glow,
                            'ring-2',
                            color.ring,
                            'animate-pulse'
                          )
                        : 'bg-[rgb(var(--surface-raised))] border-[rgb(var(--border))] opacity-50 group-hover:opacity-80'
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Icon
                        className={cn(
                          'w-4.5 h-4.5 transition-colors',
                          isActive ? color.accent : 'text-[rgb(var(--text-muted))]'
                        )}
                      />
                    )}

                    {/* Step number badge */}
                    <span
                      className={cn(
                        'absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-mono font-bold flex items-center justify-center border',
                        isComplete
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : isActive
                          ? cn('text-white border-transparent', color.dot, 'bg-current')
                          : 'bg-[rgb(var(--surface))] text-[rgb(var(--text-muted))] border-[rgb(var(--border))]'
                      )}
                      style={
                        isActive
                          ? { backgroundColor: undefined }
                          : undefined
                      }
                    >
                      {idx + 1}
                    </span>
                  </div>

                  {/* Label */}
                  <div className="text-center px-1 min-w-0">
                    <span
                      className={cn(
                        'block text-[11px] font-semibold truncate transition-colors',
                        isComplete
                          ? 'text-emerald-300'
                          : isActive
                          ? color.accent
                          : 'text-[rgb(var(--text-muted))]'
                      )}
                    >
                      {step.shortLabel}
                    </span>
                    <span
                      className={cn(
                        'block text-[10px] font-mono truncate mt-0.5',
                        isComplete
                          ? 'text-emerald-400/70'
                          : 'text-[rgb(var(--text-muted))] opacity-70'
                      )}
                    >
                      {step.detail}
                    </span>
                  </div>
                </button>

                {/* Connector line between steps */}
                {idx < steps.length - 1 && (
                  <div className="flex-1 flex items-start pt-5 px-1 min-w-[20px] max-w-[48px]">
                    <div className="w-full h-0.5 rounded-full overflow-hidden bg-[rgb(var(--border))]">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          step.completed
                            ? cn('bg-gradient-to-r', color.line, 'w-full')
                            : 'w-0'
                        )}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile vertical stepper */}
      <div className="sm:hidden px-4 py-3 space-y-1">
        {steps.map((step, idx) => {
          const color = STEP_COLORS[idx];
          const Icon = step.icon;
          const isComplete = step.completed;
          const isActive = idx === activeIdx;

          return (
            <button
              key={step.id}
              onClick={() => handleClick(step.id)}
              className={cn(
                'w-full flex items-center gap-3 p-2.5 rounded-[var(--radius-md)] border text-left transition-all cursor-pointer',
                isComplete
                  ? 'bg-emerald-500/8 border-emerald-500/25'
                  : isActive
                  ? cn(color.bg, color.border)
                  : 'bg-transparent border-transparent opacity-60'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-xs font-mono font-bold',
                  isComplete
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                    : isActive
                    ? cn(color.bg, color.border, color.accent)
                    : 'bg-[rgb(var(--surface-raised))] border-[rgb(var(--border))] text-[rgb(var(--text-muted))]'
                )}
              >
                {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'block text-xs font-semibold truncate',
                    isComplete
                      ? 'text-emerald-300'
                      : isActive
                      ? color.accent
                      : 'text-[rgb(var(--text-muted))]'
                  )}
                >
                  {step.label}
                </span>
                <span className="block text-[10px] text-[rgb(var(--text-muted))] font-mono">
                  {step.detail}
                </span>
              </div>

              <ChevronRight
                className={cn(
                  'w-3.5 h-3.5 shrink-0 transition-colors',
                  isActive ? color.accent : 'text-[rgb(var(--border))]'
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
