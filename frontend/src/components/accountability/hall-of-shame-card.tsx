'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Trash2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Skull,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrashBadgeInfo } from '@/lib/accountability';
import { cn } from '@/lib/utils';

interface HallOfShameCardProps {
  trashInfo: TrashBadgeInfo;
  onInspect: () => void;
}

const ALL_TIERS = [
  {
    tier: 'bronze',
    name: 'Bronze: Weak Discipline (1 Day Missed)',
    days: '1 Missed Day',
    desc: 'The initial collapse. Chose cheap dopamine over 45 minutes of code.',
  },
  {
    tier: 'silver',
    name: 'Silver: Chronic Slacker (2-3 Days Missed)',
    days: '2-3 Missed Days',
    desc: 'Standards evaporating. Full of excuses, zero lines of code written.',
  },
  {
    tier: 'gold',
    name: 'Gold: Professional Quitter (4-6 Days Missed)',
    days: '4-6 Missed Days',
    desc: 'Vanished on your commitments. Watching hungry engineers take your dream job.',
  },
  {
    tier: 'dumpster',
    name: 'Dumpster Fire: NOT WORKING ON YOURSELF (7+ Days)',
    days: '7+ Missed Days',
    desc: 'Complete surrender. All talk, zero discipline. Living in total delusion.',
  },
];

export function HallOfShameCard({ trashInfo, onInspect }: HallOfShameCardProps) {
  return (
    <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-[rgb(var(--surface))] via-stone-950/40 to-[rgb(var(--surface-raised))] border-rose-500/30 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgb(var(--border))] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[rgb(var(--text-primary))] flex items-center gap-1.5">
                <span>Reverse Accountability · The Trash System</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold uppercase">
                Anti-Comfort
              </span>
            </div>
            <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">
              If you miss daily sessions, you earn Trash Badges that expose that you are not working on yourself.
            </p>
          </div>
        </div>

        {trashInfo.hasTrashBadge ? (
          <Button
            size="sm"
            onClick={onInspect}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-xs"
          >
            <span>Inspect Active Badge</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>0 Trash Badges · Clean</span>
          </div>
        )}
      </div>

      {/* Active Status Display */}
      {trashInfo.hasTrashBadge ? (
        <div className="p-4 rounded-[var(--radius-md)] bg-rose-950/40 border-2 border-rose-500/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-600 text-white uppercase tracking-wider">
                ACTIVE TRASH BADGE
              </span>
              <span className="text-sm font-black text-rose-200">
                {trashInfo.title} ({trashInfo.tier.toUpperCase()})
              </span>
            </div>
            <p className="text-xs text-stone-300 italic">
              &ldquo;{trashInfo.roastMessage}&rdquo;
            </p>
            <p className="text-[11px] text-rose-400 font-mono">
              Missed: {trashInfo.missedDays.map((d) => `Day ${d}`).join(', ')} ({trashInfo.missedCount} total)
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {trashInfo.missedDays[0] && (
              <Link href={`/day/${trashInfo.missedDays[0]}`}>
                <Button size="sm" variant="secondary" className="border-rose-500/50 text-rose-200 text-xs">
                  <span>Claw Back Day {trashInfo.missedDays[0]}</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-[var(--radius-md)] bg-emerald-500/5 border border-emerald-500/20 text-xs text-[rgb(var(--text-secondary))] flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-400">Zero Trash Badges Earned</p>
            <p className="text-[11px] text-[rgb(var(--text-muted))]">
              You are keeping your daily streak clean. Do not slack off, or your first Trash Badge will be awarded.
            </p>
          </div>
        </div>
      )}

      {/* Trash Badge Tier Hierarchy */}
      <div className="space-y-2 pt-2">
        <span className="text-xs font-mono text-[rgb(var(--text-muted))] uppercase tracking-wider block">
          The 4 Tiers of Slacking:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ALL_TIERS.map((t) => {
            const isActiveThisTier = trashInfo.hasTrashBadge && trashInfo.tier === t.tier;

            return (
              <div
                key={t.tier}
                className={cn(
                  'p-3 rounded-[var(--radius-md)] border text-xs transition-all',
                  isActiveThisTier
                    ? 'bg-rose-950/60 border-rose-500 text-white shadow-md'
                    : 'bg-[rgb(var(--surface-raised))] border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] opacity-75'
                )}
              >
                <div className="flex items-center justify-between font-mono mb-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <Trash2 className={cn('w-3.5 h-3.5', isActiveThisTier ? 'text-rose-400' : 'text-stone-500')} />
                    <span>{t.name}</span>
                  </span>
                  <span className={cn('text-[10px]', isActiveThisTier ? 'text-rose-300 font-bold' : 'text-[rgb(var(--text-muted))]')}>
                    {t.days}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-400">
                  {t.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

