'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  'aria-label': ariaLabel = 'Mark as completed',
  className,
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'group relative flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] rounded-lg transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <div
        className={cn(
          'w-7 h-7 rounded-[var(--radius-sm)] border-2 flex items-center justify-center transition-all duration-200',
          checked
            ? 'bg-[rgb(var(--success))] border-[rgb(var(--success))] text-white shadow-sm'
            : 'border-[rgb(var(--border))] bg-[rgb(var(--surface))] group-hover:border-[rgb(var(--accent))]'
        )}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}

