'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] hover:bg-[rgb(var(--accent-hover))] shadow-sm',
        secondary:
          'bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-raised))] shadow-sm',
        ghost:
          'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--text-primary))]',
        outline:
          'border border-[rgb(var(--border))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface))]',
        danger:
          'bg-[rgb(var(--danger))] text-white hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

