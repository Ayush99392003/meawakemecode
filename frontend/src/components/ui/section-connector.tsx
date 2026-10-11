'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionConnectorProps {
  label?: string;
  fromColor?: string; // tailwind text color class e.g. 'text-indigo-400'
  completed?: boolean;
}

/**
 * Visual vertical connector rendered between the sequential learning sections.
 * Shows a dashed line with an optional "Next:" label and down chevron.
 */
export function SectionConnector({
  label,
  fromColor = 'text-[rgb(var(--text-muted))]',
  completed = false,
}: SectionConnectorProps) {
  return (
    <div className="flex flex-col items-center gap-1 py-1 select-none">
      {/* Dashed line segment */}
      <div
        className={cn(
          'w-px h-5 border-l-2 border-dashed transition-colors duration-500',
          completed ? 'border-emerald-500/50' : 'border-[rgb(var(--border))]'
        )}
      />
      {label && (
        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))]">
          <ChevronDown
            className={cn('w-2.5 h-2.5 shrink-0 transition-colors', completed ? 'text-emerald-400' : fromColor)}
          />
          <span className={cn('text-[10px] font-mono font-medium transition-colors', completed ? 'text-emerald-400' : fromColor)}>
            {label}
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-px h-5 border-l-2 border-dashed transition-colors duration-500',
          completed ? 'border-emerald-500/50' : 'border-[rgb(var(--border))]'
        )}
      />
    </div>
  );
}

