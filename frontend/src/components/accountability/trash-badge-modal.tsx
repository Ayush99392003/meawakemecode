'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Trash2,
  AlertTriangle,
  Flame,
  ArrowRight,
  X,
  ShieldAlert,
  RotateCcw,
  Skull,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrashBadgeInfo } from '@/lib/accountability';
import { cn } from '@/lib/utils';

interface TrashBadgeModalProps {
  trashInfo: TrashBadgeInfo;
  isOpen: boolean;
  onClose: () => void;
}

export function TrashBadgeModal({ trashInfo, isOpen, onClose }: TrashBadgeModalProps) {
  if (!isOpen) return null;

  const isDumpster = trashInfo.tier === 'dumpster';
  const isGold = trashInfo.tier === 'gold';
  const isSilver = trashInfo.tier === 'silver';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-stone-950 via-zinc-900 to-black border-2 border-rose-500/50 rounded-[var(--radius-lg)] p-5 sm:p-7 shadow-2xl text-stone-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Trash Badge Visual Header */}
        <div className="flex flex-col items-center text-center">
          {/* Animated Glowing Trash Icon */}
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-950 via-red-900/60 to-stone-900 border-2 border-rose-500/80 flex items-center justify-center shadow-lg shadow-rose-900/40 animate-pulse">
              {isDumpster ? (
                <Skull className="w-10 h-10 text-rose-400 animate-bounce" />
              ) : (
                <Trash2 className="w-10 h-10 text-rose-400" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider shadow">
              {trashInfo.tier.toUpperCase()}
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Reverse Accountability System
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
            TRASH BADGE: {trashInfo.title}
          </h2>

          <p className="text-xs text-rose-300 font-mono mt-0.5">
            {trashInfo.subtitle}
          </p>

          {/* Harsh Reality Quote */}
          <div className="w-full my-4 p-4 rounded-[var(--radius-md)] bg-rose-950/30 border border-rose-500/40 text-left">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1 font-mono">
                  Reality Check
                </p>
                <p className="text-xs sm:text-sm text-stone-300 italic leading-relaxed">
                  &ldquo;{trashInfo.roastMessage}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Missed Days Breakdown */}
          {trashInfo.missedDays.length > 0 && (
            <div className="w-full text-left space-y-2 mb-4">
              <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
                Uncompleted Backlog ({trashInfo.missedCount} Days Missed):
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {trashInfo.missedDays.map((d) => (
                  <Link
                    key={d}
                    href={`/day/${d}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/60 border border-rose-500/50 text-rose-200 hover:bg-rose-900 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    <span>Day {d}</span>
                    <ArrowRight className="w-3 h-3 text-rose-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Redemption Protocol */}
          <div className="w-full text-left space-y-1.5 p-3 rounded-[var(--radius-md)] bg-stone-900 border border-stone-800 text-xs">
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              How to Burn This Trash Badge:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-stone-400 text-[11px]">
              {trashInfo.redemptionSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-2.5 mt-5">
            {trashInfo.missedDays.length > 0 && (
              <Link
                href={`/day/${trashInfo.missedDays[0]}`}
                onClick={onClose}
                className="flex-1"
              >
                <Button
                  variant="primary"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  <span>Redeem Day {trashInfo.missedDays[0]}</span>
                </Button>
              </Link>
            )}
            <Button
              variant="secondary"
              className="flex-1 border-stone-700 text-stone-300 hover:bg-stone-800"
              onClick={onClose}
            >
              I Admit My Slacking &amp; Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

