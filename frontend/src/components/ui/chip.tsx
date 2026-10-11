import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const chipVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-full text-xs px-2.5 py-0.5 transition-colors whitespace-nowrap',
  {
    variants: {
      variant: {
        easy: 'bg-[rgb(var(--success)/0.12)] text-[rgb(var(--success))] border border-[rgb(var(--success)/0.25)]',
        medium: 'bg-[rgb(var(--warning)/0.12)] text-[rgb(var(--warning))] border border-[rgb(var(--warning)/0.25)]',
        hard: 'bg-[rgb(var(--hard)/0.15)] text-[rgb(var(--hard))] border border-[rgb(var(--hard)/0.3)]',
        neutral: 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border))]',
        lc: 'bg-[rgb(var(--lc-badge)/0.12)] text-[rgb(var(--lc-badge))] border border-[rgb(var(--lc-badge)/0.25)] font-semibold',
        cf: 'bg-[rgb(var(--cf-badge)/0.12)] text-[rgb(var(--cf-badge))] border border-[rgb(var(--cf-badge)/0.25)] font-semibold',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {}

export function Chip({ className, variant, ...props }: ChipProps) {
  return <span className={cn(chipVariants({ variant, className }))} {...props} />;
}

