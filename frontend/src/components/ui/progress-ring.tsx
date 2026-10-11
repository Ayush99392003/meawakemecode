'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressRingProps {
  value: number; // e.g. 0 to 5
  max?: number;  // e.g. 5
  size?: number; // diameter in px
  strokeWidth?: number;
  showText?: boolean;
  className?: string;
}

export function ProgressRing({
  value,
  max = 5,
  size = 64,
  strokeWidth = 6,
  showText = true,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, value / max));
  const offset = circumference - progress * circumference;
  const isComplete = value >= max && max > 0;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(var(--border))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isComplete ? 'rgb(var(--success))' : 'rgb(var(--accent))'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-600 ease-out"
        />
      </svg>
      {showText && (
        <span className="absolute text-xs font-semibold text-[rgb(var(--text-primary))] font-mono">
          {value}/{max}
        </span>
      )}
    </div>
  );
}

