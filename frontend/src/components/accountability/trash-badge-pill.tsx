'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { TrashBadgeInfo } from '@/lib/accountability';
import { cn } from '@/lib/utils';

interface TrashBadgePillProps {
  trashInfo: TrashBadgeInfo;
  onClick: () => void;
}

export function TrashBadgePill({ trashInfo, onClick }: TrashBadgePillProps) {
  if (!trashInfo.hasTrashBadge) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-bold transition-all cursor-pointer',
        'bg-rose-950/70 border-rose-500/60 text-rose-300 hover:bg-rose-900 hover:border-rose-400 hover:text-white shadow-sm animate-pulse'
      )}
      title="Reverse Accountability: Click to inspect active Trash Badge"
    >
      <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
      <span>{trashInfo.missedCount}d Missed · {trashInfo.tier.toUpperCase()}</span>
    </button>
  );
}

