'use client';

import * as React from 'react';
import {
  BookOpen,
  Cpu,
  Layers,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TheoryBlock } from './theory-block';
import { CsFundamentalsBlock } from './cs-fundamentals-block';
import { SystemDesignBlock } from './system-design-block';
import { useProgressStore } from '@/lib/stores/progress-store';
import { CsDailyModule, SystemDesignDailyModule } from '@/lib/data';
import { trackTheoryModuleRead } from '@/lib/telemetry';
import { cn } from '@/lib/utils';

interface FocusTheoryReaderProps {
  dayNumber: number;
  theme: string;
  summary: string;
  csModule: CsDailyModule | undefined;
  sdModule: SystemDesignDailyModule | undefined;
  initialModule?: 0 | 1 | 2;
  onContinueToMcq?: () => void;
}

const MODULE_META = [
  {
    id: 'dsa',
    label: 'DSA Theory',
    shortLabel: 'DSA',
    icon: BookOpen,
    color: 'text-indigo-400',
    activeBg: 'bg-indigo-500/15 border-indigo-500/40',
    activeDot: 'bg-indigo-400',
    readTimeLabel: '~8 min',
  },
  {
    id: 'cs',
    label: 'CS Fundamentals',
    shortLabel: 'CS Fund',
    icon: Cpu,
    color: 'text-blue-400',
    activeBg: 'bg-blue-500/15 border-blue-500/40',
    activeDot: 'bg-blue-400',
    readTimeLabel: '~6 min',
  },
  {
    id: 'sd',
    label: 'System Design',
    shortLabel: 'Sys Design',
    icon: Layers,
    color: 'text-purple-400',
    activeBg: 'bg-purple-500/15 border-purple-500/40',
    activeDot: 'bg-purple-400',
    readTimeLabel: '~7 min',
  },
];

export function FocusTheoryReader({
  dayNumber,
  theme,
  summary,
  csModule,
  sdModule,
  initialModule = 0,
  onContinueToMcq,
}: FocusTheoryReaderProps) {
  const [moduleIndex, setModuleIndex] = React.useState<0 | 1 | 2>(initialModule);
  const [animKey, setAnimKey] = React.useState(0);

  // Sync when initialModule changes (e.g. from tab buttons)
  React.useEffect(() => {
    setModuleIndex(initialModule);
  }, [initialModule]);

  const { theoryRead, csTheoryRead, systemDesignRead, markTheoryRead, markCsTheoryRead, markSystemDesignRead } =
    useProgressStore();

  const isDsaRead = !!theoryRead[dayNumber];
  const isCsRead = !!csTheoryRead[dayNumber];
  const isSdRead = !!systemDesignRead[dayNumber];

  const readState = [isDsaRead, isCsRead, isSdRead];

  const goTo = (idx: 0 | 1 | 2) => {
    setModuleIndex(idx);
    setAnimKey((k) => k + 1);
  };

  const handleMarkAndNext = () => {
    if (moduleIndex === 0 && !isDsaRead) {
      markTheoryRead(dayNumber);
      trackTheoryModuleRead(dayNumber, 'dsa');
    }
    if (moduleIndex === 1 && !isCsRead) {
      markCsTheoryRead(dayNumber);
      trackTheoryModuleRead(dayNumber, 'cs');
    }
    if (moduleIndex === 2 && !isSdRead) {
      markSystemDesignRead(dayNumber);
      trackTheoryModuleRead(dayNumber, 'system_design');
    }

    if (moduleIndex < 2) {
      goTo((moduleIndex + 1) as 0 | 1 | 2);
    }
  };

  const allRead = isDsaRead && isCsRead && isSdRead;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Module Stepper */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))]">
        {MODULE_META.map((m, i) => {
          const isActive = moduleIndex === i;
          const isDone = readState[i];
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => goTo(i as 0 | 1 | 2)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer',
                isActive
                  ? cn('border', m.activeBg, m.color)
                  : isDone
                  ? 'text-[rgb(var(--success))] bg-[rgb(var(--success)/0.08)] border border-[rgb(var(--success)/0.2)]'
                  : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface))]'
              )}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[rgb(var(--success))]" />
              ) : (
                <Icon className={cn('w-3.5 h-3.5 shrink-0', isActive ? m.color : '')} />
              )}
              <span className="hidden sm:inline">{m.shortLabel}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Module title bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {React.createElement(MODULE_META[moduleIndex].icon, {
            className: cn('w-4 h-4', MODULE_META[moduleIndex].color),
          })}
          <span className={cn('text-sm font-bold', MODULE_META[moduleIndex].color)}>
            {MODULE_META[moduleIndex].label}
          </span>
          <span className="text-xs text-[rgb(var(--text-muted))] font-mono">
            Module {moduleIndex + 1} of 3
          </span>
        </div>
        <span className="text-[11px] text-[rgb(var(--text-muted))] font-mono">
          {MODULE_META[moduleIndex].readTimeLabel} read
        </span>
      </div>

      {/* Content area — animated on module change */}
      <div
        key={animKey}
        className="animate-fadeIn"
      >
        {moduleIndex === 0 && (
          <TheoryBlock dayNumber={dayNumber} theme={theme} summary={summary} forceOpen={true} />
        )}
        {moduleIndex === 1 && csModule && (
          <CsFundamentalsBlock module={csModule} dayNumber={dayNumber} />
        )}
        {moduleIndex === 1 && !csModule && (
          <div className="p-8 text-center rounded-2xl border border-dashed border-[rgb(var(--border))] text-[rgb(var(--text-muted))] text-sm">
            No CS Fundamentals module for this day.
          </div>
        )}
        {moduleIndex === 2 && sdModule && (
          <SystemDesignBlock module={sdModule} dayNumber={dayNumber} />
        )}
        {moduleIndex === 2 && !sdModule && (
          <div className="p-8 text-center rounded-2xl border border-dashed border-[rgb(var(--border))] text-[rgb(var(--text-muted))] text-sm">
            No System Design module for this day.
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[rgb(var(--border))]">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => moduleIndex > 0 && goTo((moduleIndex - 1) as 0 | 1 | 2)}
          disabled={moduleIndex === 0}
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev Module</span>
        </Button>

        {allRead ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>All 3 Theory Modules Complete!</span>
            </span>
            {onContinueToMcq && (
              <Button
                size="sm"
                variant="primary"
                onClick={onContinueToMcq}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold shadow-md shadow-emerald-500/20"
              >
                <span>Continue to MCQs (60 Qs)</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : moduleIndex < 2 ? (
          <Button
            size="sm"
            variant="primary"
            onClick={handleMarkAndNext}
            className={cn(
              'w-full sm:w-auto font-semibold',
              !readState[moduleIndex]
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/20'
                : ''
            )}
          >
            <span>{readState[moduleIndex] ? 'Next Module' : 'Mark Read & Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="primary"
            onClick={handleMarkAndNext}
            disabled={readState[moduleIndex]}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold"
          >
            <Check className="w-4 h-4" />
            <span>{readState[moduleIndex] ? 'Module Complete ✓' : 'Mark Read & Finish'}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
