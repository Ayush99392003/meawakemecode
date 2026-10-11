'use client';

import * as React from 'react';
import Link from 'next/link';
import { Lock, Check } from 'lucide-react';
import { TOTAL_DAYS } from '@/lib/data';
import { useProgressStore } from '@/lib/stores/progress-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { cn } from '@/lib/utils';

export interface DayStripProps {
  currentDay: number;
}

export function DayStrip({ currentDay }: DayStripProps) {
  const { dayCompletions } = useProgressStore();
  const { strictMode } = useSettingsStore();

  const stripRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to center current day
  React.useEffect(() => {
    if (stripRef.current) {
      const activeElement = stripRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [currentDay]);

  const daysArray = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">
          30-Day Journey
        </span>
        <span className="text-xs font-mono text-[rgb(var(--text-secondary))]">
          Day {currentDay} of 30
        </span>
      </div>

      <div
        ref={stripRef}
        className="flex items-center gap-2 overflow-x-auto py-2 px-1 no-scrollbar scroll-smooth"
      >
        {daysArray.map((num) => {
          const isDone = !!dayCompletions[num];
          const isToday = num === currentDay;
          const isMissed = !isDone && num < currentDay;
          const isLocked = strictMode && num > currentDay;

          return (
            <Link
              key={num}
              href={`/day/${num}`}
              data-active={isToday}
              title={`Day ${num}${isDone ? ' (Done)' : isToday ? ' (Today)' : isLocked ? ' (Locked)' : ''}`}
              className={cn(
                'relative flex items-center justify-center shrink-0 w-8 h-8 rounded-full text-xs font-mono font-medium transition-all duration-150',
                isDone
                  ? 'bg-[rgb(var(--success))] text-white shadow-sm'
                  : isToday
                  ? 'border-2 border-[rgb(var(--accent))] text-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.1)] ring-2 ring-[rgb(var(--accent)/0.2)]'
                  : isMissed
                  ? 'border-2 border-[rgb(var(--warning))] text-[rgb(var(--warning))] bg-[rgb(var(--warning)/0.08)]'
                  : isLocked
                  ? 'border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] bg-[rgb(var(--surface)/0.6)]'
                  : 'border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--accent))] hover:text-[rgb(var(--accent))]'
              )}
            >
              {isDone ? (
                <Check className="w-4 h-4 stroke-[2.5]" />
              ) : isLocked ? (
                <Lock className="w-3 h-3 text-[rgb(var(--text-muted))]" />
              ) : (
                num
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

