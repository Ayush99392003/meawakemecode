'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Flame,
  Trophy,
  CheckCircle2,
  Calendar,
  Sparkles,
  Snowflake,
  ExternalLink,
  Layers,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';
import {
  TOTAL_DAYS,
  TOTAL_PROBLEMS,
  problems as allProblemsData,
  getAllTags,
} from '@/lib/data';
import { useProgressStore } from '@/lib/stores/progress-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { calculateStreak } from '@/lib/streak';
import { calculateTrashBadge } from '@/lib/accountability';
import { HallOfShameCard } from '@/components/accountability/hall-of-shame-card';
import { TrashBadgeModal } from '@/components/accountability/trash-badge-modal';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { Chip } from '@/components/ui/chip';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { userEmail } = useSettingsStore();
  const { problems, dayCompletions, startDate } = useProgressStore();
  const streak = calculateStreak(dayCompletions, startDate);
  const [showTrashModal, setShowTrashModal] = React.useState(false);

  const trashInfo = React.useMemo(
    () => calculateTrashBadge(dayCompletions, startDate),
    [dayCompletions, startDate]
  );

  const totalSolved = Object.values(problems).filter(
    (p) => p.status === 'solved'
  ).length;

  const totalDaysCompleted = Object.keys(dayCompletions).length;

  // Platform breakdown
  const lcSolved = Object.keys(problems).filter(
    (id) => id.startsWith('lc_') && problems[id].status === 'solved'
  ).length;

  const cfSolved = Object.keys(problems).filter(
    (id) => id.startsWith('cf_') && problems[id].status === 'solved'
  ).length;

  // Generate 12-week heatmap grid (84 days)
  const heatmapDays = React.useMemo(() => {
    const daysArr = [];
    const now = new Date();

    for (let i = 83; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Count problems solved on this date
      const count = Object.values(problems).filter(
        (p) => p.solvedAt && p.solvedAt.startsWith(dateStr)
      ).length;

      daysArr.push({
        date: dateStr,
        count,
      });
    }
    return daysArr;
  }, [problems]);

  // Topic strength calculations
  const allTags = React.useMemo(() => getAllTags().slice(0, 8), []);
  const tagStats = React.useMemo(() => {
    return allTags.map((tag) => {
      const tagProblems = allProblemsData.filter((p) => p.tags.includes(tag));
      const solvedInTag = tagProblems.filter(
        (p) => problems[p.id]?.status === 'solved'
      ).length;
      return {
        tag,
        total: tagProblems.length,
        solved: solvedInTag,
        percent: tagProblems.length > 0 ? (solvedInTag / tagProblems.length) * 100 : 0,
      };
    });
  }, [allTags, problems]);

  // Recent activity list
  const recentActivity = React.useMemo(() => {
    return Object.values(problems)
      .filter((p) => p.solvedAt)
      .sort((a, b) => new Date(b.solvedAt!).getTime() - new Date(a.solvedAt!).getTime())
      .slice(0, 8);
  }, [problems]);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
          Performance & Mastery Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] mt-0.5">
          Track problem retention, consistency metrics, and conceptual strengths.
        </p>
      </div>

      {/* Cloud Sync Status Banner */}
      {!userEmail ? (
        <Banner
          variant="info"
          action={
            <Link href="/login">
              <Button size="sm" variant="primary">
                Sync Account
              </Button>
            </Link>
          }
        >
          Progress is saved on this device only. Connect your email to sync across laptop and phone.
        </Banner>
      ) : (
        <div className="flex items-center justify-between p-3.5 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Cloud sync active for <strong className="font-mono text-white">{userEmail}</strong>. Solves and badges are backed up automatically.
            </span>
          </div>
          <Link href="/settings">
            <Button size="sm" variant="secondary" className="text-xs h-7 px-2.5">
              Sync Settings
            </Button>
          </Link>
        </div>
      )}

      {/* 1. Streak & Consistency Card */}
      <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-[rgb(var(--surface))] to-[rgb(var(--surface-raised))]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--warning)/0.12)] text-[rgb(var(--warning))] flex items-center justify-center shrink-0">
              <Flame className="w-8 h-8 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[rgb(var(--text-primary))] font-mono">
                  {streak.current} Days
                </h2>
                {streak.hasFreezeAvailable && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    <Snowflake className="w-3.5 h-3.5" /> 1 Freeze Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">
                Current Daily Streak • Longest: {streak.longest} consecutive days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-[rgb(var(--text-muted))]">Daily Freeze</span>
              <p className="font-semibold text-[rgb(var(--text-primary))]">
                {streak.longest >= 7 ? 'Unlocked' : `${7 - streak.longest}d to unlock`}
              </p>
            </div>
          </div>
        </div>

        {/* 12-Week Heatmap */}
        <div className="mt-6 pt-5 border-t border-[rgb(var(--border))]">
          <div className="flex items-center justify-between text-xs text-[rgb(var(--text-muted))] mb-2 font-mono">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-[rgb(var(--accent))]" />
              Activity Heatmap (Past 12 Weeks)
            </span>
            <span>{totalSolved} Total Solved</span>
          </div>

          <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto py-1">
            {heatmapDays.map((hd, i) => {
              const intensity =
                hd.count === 0
                  ? 'bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))]'
                  : hd.count === 1
                  ? 'bg-[rgb(var(--accent)/0.3)]'
                  : hd.count <= 3
                  ? 'bg-[rgb(var(--accent)/0.6)]'
                  : 'bg-[rgb(var(--accent))]';

              return (
                <div
                  key={i}
                  title={`${hd.date}: ${hd.count} solved`}
                  className={cn(
                    'w-3.5 h-3.5 rounded-xs transition-colors hover:scale-125 cursor-pointer',
                    intensity
                  )}
                />
              );
            })}
          </div>
        </div>
      </Card>

      {/* 2. Reverse Accountability & Hall of Shame Card */}
      <HallOfShameCard
        trashInfo={trashInfo}
        onInspect={() => setShowTrashModal(true)}
      />

      {/* 3. Key Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs text-[rgb(var(--text-muted))] font-medium">Total Solved</span>
          <p className="text-2xl font-bold font-mono text-[rgb(var(--text-primary))]">
            {totalSolved}
          </p>
          <span className="text-[11px] text-[rgb(var(--text-secondary))] font-mono">
            of {TOTAL_PROBLEMS} ({Math.round((totalSolved / TOTAL_PROBLEMS) * 100)}%)
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-[rgb(var(--text-muted))] font-medium">Days Cleared</span>
          <p className="text-2xl font-bold font-mono text-[rgb(var(--text-primary))]">
            {totalDaysCompleted}
          </p>
          <span className="text-[11px] text-[rgb(var(--text-secondary))] font-mono">
            of {TOTAL_DAYS} ({Math.round((totalDaysCompleted / TOTAL_DAYS) * 100)}%)
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-[rgb(var(--text-muted))] font-medium">LeetCode (LC)</span>
          <p className="text-2xl font-bold font-mono text-[rgb(var(--warning))]">
            {lcSolved}
          </p>
          <span className="text-[11px] text-[rgb(var(--text-secondary))] font-mono">
            of 90 curated
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs text-[rgb(var(--text-muted))] font-medium">Codeforces (CF)</span>
          <p className="text-2xl font-bold font-mono text-[rgb(var(--cf-badge))]">
            {cfSolved}
          </p>
          <span className="text-[11px] text-[rgb(var(--text-secondary))] font-mono">
            of 60 curated
          </span>
        </Card>
      </div>

      {/* 3. Topic Strength Breakdown */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base text-[rgb(var(--text-primary))]">
            Topic Strength & Coverage
          </h3>
          <span className="text-xs text-[rgb(var(--text-muted))] font-mono">
            Solved / Total
          </span>
        </div>

        <div className="space-y-3">
          {tagStats.map((ts) => (
            <div key={ts.tag} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[rgb(var(--text-secondary))]">{ts.tag}</span>
                <span className="font-mono text-[rgb(var(--text-muted))]">
                  {ts.solved} / {ts.total} ({Math.round(ts.percent)}%)
                </span>
              </div>
              <ProgressBar value={ts.solved} max={Math.max(1, ts.total)} size="sm" variant="accent" />
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Recent Solves */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-base text-[rgb(var(--text-primary))]">
          Recent Activity
        </h3>

        {recentActivity.length === 0 ? (
          <p className="text-xs text-[rgb(var(--text-muted))]">
            No problems recorded as solved yet. Complete your first problem on Day 1 to populate this feed.
          </p>
        ) : (
          <div className="divide-y divide-[rgb(var(--border))]">
            {recentActivity.map((item) => (
              <div key={item.problemId} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[rgb(var(--success))]" />
                  <span className="font-mono font-medium text-[rgb(var(--text-primary))]">
                    {item.problemId}
                  </span>
                  {item.isLate && (
                    <span className="text-[10px] text-[rgb(var(--warning))] font-mono">
                      (Completed Late)
                    </span>
                  )}
                </div>

                <span className="text-[rgb(var(--text-muted))] font-mono">
                  {item.solvedAt ? new Date(item.solvedAt).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reverse Accountability Trash Badge Modal */}
      <TrashBadgeModal
        trashInfo={trashInfo}
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
      />
    </div>
  );
}

