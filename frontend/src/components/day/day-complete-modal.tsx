'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dayComplete, streakMessages } from '@/lib/copy';
import { calculateStreak } from '@/lib/streak';
import { useProgressStore } from '@/lib/stores/progress-store';
import Link from 'next/link';

export interface DayCompleteModalProps {
  dayNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

export function DayCompleteModal({ dayNumber, isOpen, onClose }: DayCompleteModalProps) {
  const { dayCompletions, startDate } = useProgressStore();
  const streak = calculateStreak(dayCompletions, startDate);
  const praise = React.useMemo(() => dayComplete.getPraise(), []);

  const isWeekComplete = dayNumber % 7 === 0;
  const weekNum = Math.floor(dayNumber / 7);
  const daysLeft = 30 - dayNumber;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-[var(--radius-lg)] p-6 shadow-xl"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-raised))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            {/* Celebration Icon */}
            <div className="w-14 h-14 rounded-full bg-[rgb(var(--success)/0.12)] text-[rgb(var(--success))] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-xs font-mono font-semibold text-[rgb(var(--success))] uppercase tracking-wider">
              Goal Achieved
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))] mt-1">
              Day {dayNumber} Complete!
            </h2>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1.5 italic">
              &ldquo;{praise}&rdquo;
            </p>

            {/* Streak & Stats Box */}
            <div className="w-full grid grid-cols-2 gap-3 my-5 p-3.5 rounded-[var(--radius-md)] bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))]">
              <div className="flex flex-col items-center">
                <span className="text-[11px] text-[rgb(var(--text-muted))] font-medium">
                  Current Streak
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-base font-bold text-[rgb(var(--warning))] font-mono">
                  <Flame className="w-4 h-4 fill-current" />
                  <span>{streak.current} Days</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[11px] text-[rgb(var(--text-muted))] font-medium">
                  Problems Done
                </span>
                <span className="mt-0.5 text-base font-bold text-[rgb(var(--text-primary))] font-mono">
                  {dayNumber * 5} / 150
                </span>
              </div>
            </div>

            {/* Week Milestone if applicable */}
            {isWeekComplete && (
              <div className="w-full mb-4 p-3 rounded-[var(--radius-sm)] bg-[rgb(var(--accent)/0.08)] border border-[rgb(var(--accent)/0.25)] text-xs text-[rgb(var(--accent))] font-medium flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>
                  Week {weekNum} Cleared! {daysLeft > 0 ? `${daysLeft} days to go.` : 'All 30 days completed!'}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="w-full flex flex-col sm:flex-row gap-2 mt-2">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Review Solutions
              </Button>
              {dayNumber < 30 ? (
                <Link href={`/day/${dayNumber + 1}`} className="flex-1" onClick={onClose}>
                  <Button variant="primary" className="w-full">
                    <span>Day {dayNumber + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/me" className="flex-1" onClick={onClose}>
                  <Button variant="primary" className="w-full">
                    <Trophy className="w-4 h-4" />
                    <span>View Diploma</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

