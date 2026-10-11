'use client';

import * as React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useSettingsStore, type ThemeMode } from '@/lib/stores/settings-store';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useSettingsStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleNext = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={cn(
          'w-9 h-9 rounded-lg border border-[rgb(var(--border))] flex items-center justify-center text-[rgb(var(--text-secondary))]',
          className
        )}
      >
        <span className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleNext}
      aria-label={`Current theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
      className={cn(
        'w-9 h-9 rounded-lg border border-[rgb(var(--border))] flex items-center justify-center text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-raised))] transition-colors cursor-pointer',
        className
      )}
    >
      {theme === 'light' && <Sun className="w-4 h-4 text-[rgb(var(--warning))]" />}
      {theme === 'dark' && <Moon className="w-4 h-4 text-[rgb(var(--accent))]" />}
      {theme === 'system' && <Laptop className="w-4 h-4 text-[rgb(var(--text-muted))]" />}
    </button>
  );
}

