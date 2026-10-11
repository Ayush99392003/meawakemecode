'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Zap,
  Trophy,
  Target,
  BookOpen,
  TrendingUp,
  Flame,
  Star,
  ArrowRight,
  Clock,
  CheckCircle2,
  Brain,
  Layers,
  GitBranch,
  Search,
  Database,
  Compass,
} from 'lucide-react';
import { useProgressStore } from '@/lib/stores/progress-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { calculateStreak } from '@/lib/streak';
import { days } from '@/lib/data';
import { cn } from '@/lib/utils';

/* ─── Left Sidebar ─────────────────────────────────────────────── */

const motivationalQuotes = [
  { quote: "Every problem you solve is a brick in your engineering foundation.", author: "Principle #1" },
  { quote: "The difference between O(N²) and O(N log N) is the difference between a failed interview and an offer.", author: "Principle #2" },
  { quote: "An invariant held at every step is a proof of correctness, not just a heuristic.", author: "Principle #3" },
  { quote: "Brute force is your first thought. Optimal is your second. Submit the second.", author: "Principle #4" },
  { quote: "Space is a trade-off, not a penalty. Using O(N) extra memory to save O(N²) time is engineering wisdom.", author: "Principle #5" },
  { quote: "The best DSA solution is the one you can explain clearly to a 5-year-old.", author: "Principle #6" },
];

const complexityLadder = [
  { label: 'O(1)', name: 'Constant', color: '#22c55e', desc: 'Hash lookups, array index access' },
  { label: 'O(log N)', name: 'Logarithmic', color: '#86efac', desc: 'Binary search, balanced BST' },
  { label: 'O(N)', name: 'Linear', color: '#facc15', desc: 'Single scan, two pointers' },
  { label: 'O(N log N)', name: 'Linearithmic', color: '#fb923c', desc: 'Merge sort, heapify' },
  { label: 'O(N²)', name: 'Quadratic', color: '#f87171', desc: 'Nested loops — avoid in production!' },
  { label: 'O(2ᴺ)', name: 'Exponential', color: '#dc2626', desc: 'Brute force backtracking' },
];

// Major topic groupings mapped to curriculum days
const topicCategories = [
  { name: 'Arrays & Hashing', dayNumbers: [1, 4], color: '#6366f1' },
  { name: 'Two Pointers & Window', dayNumbers: [2, 3], color: '#06b6d4' },
  { name: 'Binary Search', dayNumbers: [5, 8], color: '#f59e0b' },
  { name: 'Linked Lists', dayNumbers: [6], color: '#10b981' },
  { name: 'Stacks & Queues', dayNumbers: [7], color: '#ec4899' },
  { name: 'Trees & Graphs', dayNumbers: [9, 10, 11, 12, 13, 14], color: '#8b5cf6' },
  { name: 'Dynamic Programming', dayNumbers: [17, 18, 19, 20, 21], color: '#ef4444' },
];

export function LeftSidebar() {
  const [quoteIndex, setQuoteIndex] = React.useState(0);
  const { problems } = useProgressStore();

  React.useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % motivationalQuotes.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const currentQuote = motivationalQuotes[quoteIndex];

  // Calculate REAL mastery percentage for each major topic
  const topicMastery = React.useMemo(() => {
    return topicCategories.map((cat) => {
      let totalProblemsInCat = 0;
      let solvedInCat = 0;

      cat.dayNumbers.forEach((dNum) => {
        const dayData = days.find((d) => d.number === dNum);
        if (dayData) {
          totalProblemsInCat += dayData.problemIds.length;
          dayData.problemIds.forEach((pId) => {
            if (problems[pId]?.status === 'solved') {
              solvedInCat++;
            }
          });
        }
      });

      const percent = totalProblemsInCat > 0 
        ? Math.round((solvedInCat / totalProblemsInCat) * 100) 
        : 0;

      return {
        name: cat.name,
        color: cat.color,
        solved: solvedInCat,
        total: totalProblemsInCat,
        percent,
      };
    });
  }, [problems]);

  return (
    <aside className="hidden xl:flex flex-col gap-4 w-64 shrink-0 sticky top-20 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto pb-6 pr-1 scrollbar-none hover:scrollbar-thin">
      {/* Rotating Motivational Quote Card */}
      <div className="relative p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] overflow-hidden group shadow-sm">
        <div className="absolute inset-0 opacity-[0.03] bg-gradient-to-br from-indigo-500 via-purple-500 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[rgb(var(--accent))] flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Core Principle
          </span>
          <span className="text-[10px] font-mono text-[rgb(var(--text-muted))]">
            {quoteIndex + 1}/{motivationalQuotes.length}
          </span>
        </div>
        
        <p className="text-xs leading-relaxed text-[rgb(var(--text-secondary))] italic min-h-[48px] transition-all duration-500">
          &ldquo;{currentQuote.quote}&rdquo;
        </p>

        {/* Quote navigator dots */}
        <div className="flex gap-1 mt-3">
          {motivationalQuotes.map((_, i) => (
            <button
              key={i}
              onClick={() => setQuoteIndex(i)}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                i === quoteIndex
                  ? 'w-4 bg-[rgb(var(--accent))]'
                  : 'w-1 bg-[rgb(var(--border))] hover:bg-[rgb(var(--text-muted))]'
              )}
              aria-label={`Go to quote ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Complexity Ladder */}
      <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] space-y-3 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-[rgb(var(--accent))]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-primary))]">
            Complexity Ladder
          </h3>
        </div>

        <div className="space-y-2.5">
          {complexityLadder.map(({ label, name, color, desc }) => (
            <div key={label} className="flex items-start gap-2.5">
              <div
                className="w-2 h-2 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: color, outline: `2px solid ${color}30`, outlineOffset: '2px' }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[11px] font-mono font-bold" style={{ color }}>
                    {label}
                  </span>
                  <span className="text-[10px] text-[rgb(var(--text-muted))] font-medium">{name}</span>
                </div>
                <p className="text-[10px] text-[rgb(var(--text-muted))] leading-tight truncate">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Topic Mastery */}
      <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] space-y-3 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[rgb(var(--accent))]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-primary))]">
              Topic Mastery
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[rgb(var(--text-muted))]">Live</span>
        </div>

        <div className="space-y-2.5">
          {topicMastery.slice(0, 5).map(({ name, percent, solved, total, color }) => (
            <div key={name} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[rgb(var(--text-secondary))] truncate max-w-[140px]">{name}</span>
                <span className="font-mono text-[10px] font-semibold" style={{ color }}>
                  {percent}% ({solved}/{total})
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[rgb(var(--surface-raised))] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${percent}%`, backgroundColor: color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interview Readiness Checklist */}
      <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] space-y-2.5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-[rgb(var(--success))]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-primary))]">
            Interview Rubric
          </h3>
        </div>

        {[
          '1. State Time & Space Complexity upfront',
          '2. Check empty/single element edge cases',
          '3. Check integer overflow limits (2³¹ - 1)',
          '4. Trace with sample input before coding',
          '5. Prove your monotonic/lookup invariant',
        ].map((item, i) => (
          <p key={i} className="text-[11px] text-[rgb(var(--text-secondary))] leading-relaxed flex items-start gap-1.5">
            <span className="text-[rgb(var(--accent))] font-bold">•</span>
            <span>{item}</span>
          </p>
        ))}
      </div>
    </aside>
  );
}

/* ─── Right Sidebar ─────────────────────────────────────────────── */

const milestones = [
  { label: 'First Problem Solved', threshold: 1, icon: '🎯' },
  { label: 'Week 1 Complete (5 Days)', threshold: 5, icon: '🗓️' },
  { label: '25 Problems Cleared', threshold: 25, icon: '🔥' },
  { label: 'Halfway Mark (75 Solved)', threshold: 75, icon: '⚡' },
  { label: '30-Day Master (150 Solved)', threshold: 150, icon: '🏆' },
];

export function RightSidebar() {
  const { problems, dayCompletions, startDate } = useProgressStore();
  const { userEmail } = useSettingsStore();
  const streak = calculateStreak(dayCompletions, startDate);
  
  const totalSolved = Object.values(problems).filter((p) => p.status === 'solved').length;
  const totalDaysCompleted = Object.keys(dayCompletions).length;

  const nextMilestone = milestones.find((m) => totalSolved < m.threshold) || milestones[milestones.length - 1];
  const prevMilestoneThreshold = milestones.slice().reverse().find((m) => totalSolved >= m.threshold)?.threshold || 0;

  // Dynamic roadmap window: show current day and nearby days
  const activeDayNumber = Math.max(1, totalDaysCompleted + 1);
  const roadmapDays = React.useMemo(() => {
    // Show a smart window of 8 days
    const startIdx = Math.max(0, Math.min(days.length - 8, activeDayNumber - 2));
    return days.slice(startIdx, startIdx + 8);
  }, [activeDayNumber]);

  return (
    <aside className="hidden xl:flex flex-col gap-4 w-60 shrink-0 sticky top-20 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto pb-6 pl-1 scrollbar-none hover:scrollbar-thin">
      {/* Streak & Stats Hero Card */}
      <div className="relative p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] overflow-hidden shadow-sm">
        <div className="absolute inset-0 opacity-[0.04] bg-gradient-to-bl from-orange-400 via-amber-300 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[rgb(var(--warning))] fill-[rgb(var(--warning))]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-primary))]">
              Your Stats
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]">
            30 Days
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-xl bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] text-center">
            <div className="text-xl font-black font-mono text-[rgb(var(--warning))]">{streak.current}</div>
            <div className="text-[10px] text-[rgb(var(--text-muted))] font-medium">day streak</div>
          </div>
          <div className="p-2 rounded-xl bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] text-center">
            <div className="text-xl font-black font-mono text-[rgb(var(--accent))]">{totalSolved}</div>
            <div className="text-[10px] text-[rgb(var(--text-muted))] font-medium">solved</div>
          </div>
          <div className="p-2 rounded-xl bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] text-center">
            <div className="text-xl font-black font-mono text-[rgb(var(--success))]">{totalDaysCompleted}</div>
            <div className="text-[10px] text-[rgb(var(--text-muted))] font-medium">days done</div>
          </div>
          <div className="p-2 rounded-xl bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] text-center">
            <div className="text-xl font-black font-mono text-[rgb(var(--text-primary))]">{150 - totalSolved}</div>
            <div className="text-[10px] text-[rgb(var(--text-muted))] font-medium">remaining</div>
          </div>
        </div>

        {/* Cloud Sync indicator */}
        {userEmail && (
          <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgb(var(--success)/0.08)] border border-[rgb(var(--success)/0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--success))] animate-pulse" />
            <span className="text-[10px] text-[rgb(var(--success))] font-medium truncate">
              Backed up: {userEmail.split('@')[0]}
            </span>
          </div>
        )}
      </div>

      {/* Next Milestone */}
      <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] space-y-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-[rgb(var(--warning))]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-primary))]">
            Next Milestone
          </h3>
        </div>

        <div className="text-center py-1">
          <div className="text-2xl mb-1">{nextMilestone.icon}</div>
          <p className="text-xs font-semibold text-[rgb(var(--text-primary))]">{nextMilestone.label}</p>
          <p className="text-[10px] text-[rgb(var(--text-muted))] mt-0.5">
            {Math.max(0, nextMilestone.threshold - totalSolved)} solves away
          </p>
        </div>

        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-[rgb(var(--surface-raised))] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--accent))] to-purple-500 transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(5, ((totalSolved - prevMilestoneThreshold) / (nextMilestone.threshold - prevMilestoneThreshold || 1)) * 100))}%`
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[rgb(var(--text-muted))] font-mono">
            <span>{prevMilestoneThreshold}</span>
            <span>{totalSolved} / {nextMilestone.threshold}</span>
          </div>
        </div>
      </div>

      {/* Dynamic 30-Day Roadmap */}
      <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] space-y-2 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[rgb(var(--accent))]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-primary))]">
              Curriculum Path
            </h3>
          </div>
          <Link href="/sheet" className="text-[10px] text-[rgb(var(--accent))] hover:underline font-mono">
            Sheet →
          </Link>
        </div>

        <div className="space-y-1">
          {roadmapDays.map((d) => {
            const isDone = !!dayCompletions[d.number];
            const isCurrent = d.number === activeDayNumber;
            return (
              <Link
                key={d.number}
                href={`/day/${d.number}`}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-[11px] group',
                  isDone
                    ? 'text-[rgb(var(--success))] hover:bg-[rgb(var(--success)/0.08)]'
                    : isCurrent
                    ? 'bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))] font-semibold border border-[rgb(var(--accent)/0.25)]'
                    : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-raised))]'
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-md text-[9px] font-bold flex items-center justify-center shrink-0 font-mono',
                    isDone
                      ? 'bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))]'
                      : isCurrent
                      ? 'bg-[rgb(var(--accent))] text-white'
                      : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'
                  )}
                >
                  {isDone ? '✓' : d.number}
                </span>
                <span className="truncate">{d.theme}</span>
                {isCurrent && (
                  <ArrowRight className="w-3 h-3 ml-auto opacity-80 shrink-0 text-[rgb(var(--accent))]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Hydration-Safe Daily Timer */}
      <DailyCountdown />
    </aside>
  );
}

function DailyCountdown() {
  const [mounted, setMounted] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState('12h 00m');
  const [percentConsumed, setPercentConsumed] = React.useState(50);

  React.useEffect(() => {
    setMounted(true);
    const update = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, midnight.getTime() - now.getTime());
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${hours}h ${String(minutes).padStart(2, '0')}m`);

      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const elapsed = now.getTime() - startOfDay.getTime();
      setPercentConsumed(Math.min(100, Math.max(0, (elapsed / 86400000) * 100)));
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-center space-y-2 shadow-sm">
      <Clock className="w-5 h-5 text-[rgb(var(--text-muted))] mx-auto" />
      <div className="text-xl font-black font-mono text-[rgb(var(--text-primary))] tabular-nums">
        {mounted ? timeLeft : '--h --m'}
      </div>
      <p className="text-[10px] text-[rgb(var(--text-muted))]">left today to finish 5 problems</p>
      <div className="h-1.5 w-full rounded-full bg-[rgb(var(--surface-raised))] overflow-hidden mt-1">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-400 to-[rgb(var(--accent))] transition-all duration-500"
          style={{
            width: `${mounted ? percentConsumed : 0}%`
          }}
        />
      </div>
      <p className="text-[10px] text-[rgb(var(--text-muted))] italic">
        Consistency over intensity.
      </p>
    </div>
  );
}
