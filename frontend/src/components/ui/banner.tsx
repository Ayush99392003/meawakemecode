import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface BannerProps {
  variant?: 'info' | 'warning' | 'success' | 'missed';
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  action?: React.ReactNode;
}

export function Banner({
  variant = 'info',
  children,
  onDismiss,
  action,
  className,
}: BannerProps) {
  const icons = {
    info: <Info className="w-4 h-4 text-[rgb(var(--accent))] shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-[rgb(var(--warning))] shrink-0" />,
    missed: <AlertCircle className="w-4 h-4 text-[rgb(var(--warning))] shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-[rgb(var(--success))] shrink-0" />,
  };

  const bgBorder = {
    info: 'bg-[rgb(var(--accent)/0.08)] border-[rgb(var(--accent)/0.2)] text-[rgb(var(--text-primary))]',
    warning: 'bg-[rgb(var(--warning)/0.08)] border-[rgb(var(--warning)/0.25)] text-[rgb(var(--text-primary))]',
    missed: 'bg-[rgb(var(--warning)/0.08)] border-[rgb(var(--warning)/0.25)] text-[rgb(var(--text-primary))]',
    success: 'bg-[rgb(var(--success)/0.08)] border-[rgb(var(--success)/0.2)] text-[rgb(var(--text-primary))]',
  };

  return (
    <div
      role="alert"
      className={cn(
        'w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-[var(--radius-sm)] border text-sm',
        bgBorder[variant],
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        {icons[variant]}
        <div>{children}</div>
      </div>
      <div className="flex items-center gap-2">
        {action}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

