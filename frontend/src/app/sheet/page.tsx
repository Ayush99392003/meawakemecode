'use client';

import * as React from 'react';
import {
  days,
  TOTAL_DAYS,
  TOTAL_PROBLEMS,
  getProblemsForDay,
} from '@/lib/data';
import { useProgressStore } from '@/lib/stores/progress-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { getCurrentDayNumber } from '@/lib/dates';
import { DayCard } from '@/components/day/day-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ArrowDown, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function SheetPage() {
  const { problems, dayCompletions, startDate } = useProgressStore();
  const { strictMode } = useSettingsStore();

  const [filter, setFilter] = React.useState<
    'all' | 'incomplete' | 'w1' | 'w2' | 'w3' | 'w4'
  >('all');
  const [collapsedWeeks, setCollapsedWeeks] = React.useState<Record<number, boolean>>({});

  const currentDayNum = React.useMemo(() => {
    if (!startDate) return 1;
    return getCurrentDayNumber(startDate);
  }, [startDate]);

  const totalSolved = Object.values(problems).filter(
    (p) => p.status === 'solved'
  ).length;

  const totalDaysCompleted = Object.keys(dayCompletions).length;

  const toggleWeek = (week: number) => {
    setCollapsedWeeks((prev) => ({ ...prev, [week]: !prev[week] }));
  };

  // Group days by week (Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-30)
  const weeks = [
    { number: 1, name: 'Week 1: Foundations & Core Arrays', days: days.slice(0, 7) },
    { number: 2, name: 'Week 2: Linear Structures & Trees', days: days.slice(7, 14) },
    { number: 3, name: 'Week 3: Heaps, Greedy & Dynamic Programming', days: days.slice(14, 21) },
    { number: 4, name: 'Week 4: Graphs, Advanced Data Structures & Integration', days: days.slice(21, 30) },
  ];

  const filteredWeeks = weeks.filter((w) => {
    if (filter === 'all' || filter === 'incomplete') return true;
    if (filter === 'w1' && w.number === 1) return true;
    if (filter === 'w2' && w.number === 2) return true;
    if (filter === 'w3' && w.number === 3) return true;
    if (filter === 'w4' && w.number === 4) return true;
    return false;
  });

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
              30-Day Curriculum Sheet
            </h1>
            <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] mt-0.5">
              Structured step-by-step master plan. Complete 5 problems per day to advance.
            </p>
          </div>

          <Link href={`/day/${currentDayNum}`}>
            <Button size="sm" variant="primary">
              <span>Jump to Day {currentDayNum}</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Overall progress */}
        <div className="p-4 rounded-[var(--radius-md)] bg-[rgb(var(--surface))] border border-[rgb(var(--border))] space-y-2">
          <div className="flex items-center justify-between text-xs text-[rgb(var(--text-secondary))] font-medium">
            <span>Overall Roadmap Completion</span>
            <span className="font-mono text-[rgb(var(--text-primary))]">
              {totalDaysCompleted} / {TOTAL_DAYS} Days ({totalSolved} / {TOTAL_PROBLEMS} Solved)
            </span>
          </div>
          <ProgressBar value={totalSolved} max={TOTAL_PROBLEMS} size="md" variant="accent" />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-[rgb(var(--text-muted))] mr-1">Filter:</span>
          {(
            [
              ['all', 'All Days'],
              ['incomplete', 'Incomplete Only'],
              ['w1', 'Week 1'],
              ['w2', 'Week 2'],
              ['w3', 'Week 3'],
              ['w4', 'Week 4'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="cursor-pointer"
            >
              <Chip variant={filter === key ? 'lc' : 'neutral'}>
                {label}
              </Chip>
            </button>
          ))}
        </div>
      </section>

      {/* Week groups */}
      <div className="space-y-6">
        {filteredWeeks.map((week) => {
          const completedInWeek = week.days.filter((d) => !!dayCompletions[d.number]).length;
          const isWeekCleared = completedInWeek === week.days.length;
          const isCollapsed = !!collapsedWeeks[week.number];

          // If filtering incomplete, only show days that are not completed
          const displayDays =
            filter === 'incomplete'
              ? week.days.filter((d) => !dayCompletions[d.number])
              : week.days;

          if (filter === 'incomplete' && displayDays.length === 0) {
            return null;
          }

          return (
            <div
              key={week.number}
              className="border border-[rgb(var(--border))] rounded-[var(--radius-lg)] bg-[rgb(var(--surface))] overflow-hidden shadow-[var(--shadow-soft)]"
            >
              {/* Week Header */}
              <div
                onClick={() => toggleWeek(week.number)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[rgb(var(--surface-raised))] transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))]">
                    WEEK {week.number}
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm sm:text-base text-[rgb(var(--text-primary))]">
                      {week.name}
                    </h2>
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      {completedInWeek} of {week.days.length} days cleared
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isWeekCleared && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[rgb(var(--success))] bg-[rgb(var(--success)/0.1)] px-2.5 py-1 rounded-full">
                      <Sparkles className="w-3.5 h-3.5" /> Week Cleared
                    </span>
                  )}
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                  )}
                </div>
              </div>

              {/* Day Cards Grid */}
              {!isCollapsed && (
                <div className="p-4 pt-0 border-t border-[rgb(var(--border))] mt-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pt-4">
                    {displayDays.map((day) => {
                      const dayProblems = getProblemsForDay(day.number);
                      const solvedCount = dayProblems.filter(
                        (p) => problems[p.id]?.status === 'solved'
                      ).length;

                      return (
                        <DayCard
                          key={day.id}
                          day={day}
                          currentDay={currentDayNum}
                          solvedCount={solvedCount}
                          isComplete={!!dayCompletions[day.number]}
                          strictMode={strictMode}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

