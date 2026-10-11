import * as React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-[var(--radius-md)] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.5)]',
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[rgb(var(--surface-raised))] flex items-center justify-center mb-3 text-[rgb(var(--text-muted))]">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
      {description && (
        <p className="text-xs text-[rgb(var(--text-secondary))] max-w-sm mt-1 mb-4">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

