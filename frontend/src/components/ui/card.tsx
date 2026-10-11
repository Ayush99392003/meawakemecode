import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'interactive';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[var(--radius-md)] border border-[rgb(var(--border))] transition-all duration-150',
          variant === 'default' && 'bg-[rgb(var(--surface))] shadow-[var(--shadow-soft)]',
          variant === 'raised' && 'bg-[rgb(var(--surface-raised))]',
          variant === 'interactive' &&
            'bg-[rgb(var(--surface))] shadow-[var(--shadow-soft)] hover:border-[rgb(var(--accent))] hover:shadow-md cursor-pointer',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

