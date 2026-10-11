'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { DayData } from '@/lib/data';
import { ProgressRing } from '@/components/ui/progress-ring';
import { cn } from '@/lib/utils';

export interface DayCardProps {
  day: DayData;
  currentDay: number;
  solvedCount: number;
  isComplete: boolean;
  strictMode: boolean;
}

export function DayCard({
  day,
  currentDay,
  solvedCount,
  isComplete,
  strictMode,
}: DayCardProps) {
  const isLocked = strictMode && day.number > currentDay;
  const isToday = day.number === currentDay;
  const isMissed = !isComplete && day.number < currentDay;

  return (
    <Link
      href={`/day/${day.number}`}
      className={cn(
        'group relative flex flex-col justify-between p-4 rounded-[var(--radius-md)] border transition-all duration-150',
        isComplete
          ? 'bg-[rgb(var(--surface))] border-[rgb(var(--success)/0.3)] hover:border-[rgb(var(--success))] shadow-[var(--shadow-soft)]'
          : isToday
          ? 'bg-[rgb(var(--surface))] border-[rgb(var(--accent))] ring-1 ring-[rgb(var(--accent)/0.3)] shadow-md'
          : isMissed
          ? 'bg-[rgb(var(--surface))] border-[rgb(var(--warning)/0.3)] hover:border-[rgb(var(--warning))] shadow-[var(--shadow-soft)]'
          : isLocked
          ? 'bg-[rgb(var(--surface)/0.5)] border-[rgb(var(--border))] opacity-75 hover:opacity-100 cursor-pointer'
          : 'bg-[rgb(var(--surface))] border-[rgb(var(--border))] hover:border-[rgb(var(--accent))] shadow-[var(--shadow-soft)]'
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-mono font-semibold text-[rgb(var(--text-muted))]">
            DAY {day.number.toString().padStart(2, '0')}
          </span>

          {/* Status Icon */}
          {isComplete ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-[rgb(var(--success))]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Done
            </span>
          ) : isToday ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[rgb(var(--accent))] font-mono">
              <span className="w-2 h-2 rounded-full bg-[rgb(var(--accent))] animate-ping" />
              Today
            </span>
          ) : isMissed ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-[rgb(var(--warning))] font-mono">
              <AlertCircle className="w-3.5 h-3.5" />
              Pending
            </span>
          ) : isLocked ? (
            <span className="flex items-center gap-1 text-[11px] text-[rgb(var(--text-muted))]">
              <Lock className="w-3.5 h-3.5" />
              Locked
            </span>
          ) : null}
        </div>

        <h3 className="font-semibold text-sm sm:text-base text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--accent))] transition-colors line-clamp-1">
          {day.theme}
        </h3>
        <p className="text-xs text-[rgb(var(--text-secondary))] line-clamp-2 mt-1">
          {day.summary}
        </p>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgb(var(--border))]">
        <ProgressRing value={solvedCount} max={5} size={36} strokeWidth={4} />

        <div className="flex items-center gap-1 text-xs font-medium text-[rgb(var(--text-secondary))] group-hover:text-[rgb(var(--accent))] transition-colors">
          <span>{isLocked ? 'Peek' : 'View'}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

