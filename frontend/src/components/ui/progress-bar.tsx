'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'accent' | 'success' | 'warning';
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'accent',
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  const colorClass = {
    accent: 'bg-[rgb(var(--accent))]',
    success: 'bg-[rgb(var(--success))]',
    warning: 'bg-[rgb(var(--warning))]',
  }[variant];

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        'w-full bg-[rgb(var(--border))] rounded-full overflow-hidden transition-all',
        heightClass,
        className
      )}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-500 ease-out rounded-full', colorClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

