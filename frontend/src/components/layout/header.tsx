'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Flame, Bookmark as BookmarkIcon, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useProgressStore } from '@/lib/stores/progress-store';
import { calculateStreak } from '@/lib/streak';

const navItems = [
  { label: 'Today', href: '/' },
  { label: 'Sheet', href: '/sheet' },
  { label: 'Library', href: '/library' },
  { label: 'Bookmarks', href: '/bookmarks' },
];

export function Header() {
  const pathname = usePathname();
  const { dayCompletions, startDate } = useProgressStore();
  const streak = calculateStreak(dayCompletions, startDate);

  return (
    <header className="sticky top-0 z-40 hidden md:block border-b border-[rgb(var(--border))] bg-[rgb(var(--background)/0.85)] backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 xl:px-8 flex items-center justify-between h-14">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 font-bold text-base tracking-tight text-[rgb(var(--accent))] hover:opacity-90 transition-opacity">
        <span>meawakemecode</span>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))]">
          30-Day DSA
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3.5 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'text-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.08)]'
                  : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-raised))]'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/search"
          className="flex items-center gap-2 h-9 px-3 rounded-[var(--radius-sm)] border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] text-xs hover:border-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Search (Ctrl+K)</span>
        </Link>

        {/* Streak badge */}
        <Link
          href="/me"
          className={cn(
            'flex items-center gap-1.5 h-9 px-2.5 rounded-[var(--radius-sm)] border text-xs font-semibold font-mono transition-colors',
            streak.current > 0
              ? 'border-[rgb(var(--warning)/0.3)] bg-[rgb(var(--warning)/0.08)] text-[rgb(var(--warning))]'
              : 'border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--surface-raised))]'
          )}
          title={`Current Streak: ${streak.current} day(s)`}
        >
          <Flame className={cn('w-4 h-4', streak.current > 0 ? 'text-[rgb(var(--warning))] fill-[rgb(var(--warning))]' : '')} />
          <span>{streak.current}</span>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile / Me */}
        <Link
          href="/me"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-raised))] transition-colors',
            pathname === '/me' && 'border-[rgb(var(--accent))] text-[rgb(var(--accent))]'
          )}
          aria-label="Profile and Dashboard"
        >
          <User className="w-4 h-4" />
        </Link>
      </div>
    </div>
    </header>
  );
}

