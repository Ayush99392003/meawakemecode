'use client';

import * as React from 'react';
import { Trash2, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import { TrashBadgeInfo } from '@/lib/accountability';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TrashBadgeBannerProps {
  trashInfo: TrashBadgeInfo;
  onInspect: () => void;
}

export function TrashBadgeBanner({ trashInfo, onInspect }: TrashBadgeBannerProps) {
  if (!trashInfo.hasTrashBadge) return null;

  return (
    <div className="w-full rounded-[var(--radius-lg)] border-2 border-rose-500/60 bg-gradient-to-r from-rose-950/70 via-stone-900/90 to-red-950/70 p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-stone-200 animate-fadeIn">
      <div className="flex items-start sm:items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-900/80 border border-rose-500 text-rose-300 flex items-center justify-center shrink-0 shadow animate-pulse">
          <Trash2 className="w-5 h-5 text-rose-300" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white uppercase tracking-wider">
              {trashInfo.tier.toUpperCase()} TRASH BADGE
            </span>
            <span className="text-xs font-bold text-white">
              {trashInfo.title}: {trashInfo.missedCount} {trashInfo.missedCount === 1 ? 'Day' : 'Days'} Missed
            </span>
          </div>
          <p className="text-xs text-rose-300 italic">
            &ldquo;{trashInfo.roastMessage}&rdquo;
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Button
          size="sm"
          onClick={onInspect}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-xs"
        >
          <span>Burn Trash Badge</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

