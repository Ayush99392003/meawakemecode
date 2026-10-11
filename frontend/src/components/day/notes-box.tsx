'use client';

import * as React from 'react';
import { StickyNote, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotesBoxProps {
  initialValue?: string;
  onSave: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function NotesBox({
  initialValue = '',
  onSave,
  placeholder = 'Write down edge cases, time complexity learnings, or reflections...',
  className,
}: NotesBoxProps) {
  const [text, setText] = React.useState(initialValue);
  const [isSaved, setIsSaved] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setText(newVal);
    setIsSaved(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onSave(newVal);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 800);
  };

  return (
    <div
      className={cn(
        'border border-[rgb(var(--border))] rounded-[var(--radius-md)] bg-[rgb(var(--surface))] p-4 shadow-[var(--shadow-soft)]',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[rgb(var(--text-secondary))] flex items-center gap-1.5">
          <StickyNote className="w-4 h-4 text-[rgb(var(--accent))]" />
          Daily Review Notes
        </span>
        <div className="flex items-center gap-2">
          {isSaved && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-[rgb(var(--success))] font-mono animate-fadeIn">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          <span className="text-[11px] text-[rgb(var(--text-muted))] font-mono">
            {text.length} chars
          </span>
        </div>
      </div>

      <textarea
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        rows={4}
        className="w-full text-xs sm:text-sm p-3 rounded-[var(--radius-sm)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--ring))] resize-y"
      />
    </div>
  );
}

