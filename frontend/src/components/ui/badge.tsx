import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full',
        variant === 'default' && 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))]',
        variant === 'accent' && 'bg-[rgb(var(--accent)/0.15)] text-[rgb(var(--accent))]',
        variant === 'success' && 'bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))]',
        variant === 'warning' && 'bg-[rgb(var(--warning)/0.15)] text-[rgb(var(--warning))]',
        variant === 'danger' && 'bg-[rgb(var(--danger)/0.15)] text-[rgb(var(--danger))]',
        className
      )}
      {...props}
    />
  );
}

