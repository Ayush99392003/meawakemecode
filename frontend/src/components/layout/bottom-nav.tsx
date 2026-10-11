'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, BookOpen, Bookmark, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Today', href: '/', icon: Home },
  { label: 'Sheet', href: '/sheet', icon: Layers },
  { label: 'Library', href: '/library', icon: BookOpen },
  { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { label: 'Me', href: '/me', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[rgb(var(--border))] bg-[rgb(var(--background)/0.92)] backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] rounded-lg transition-colors',
                isActive
                  ? 'text-[rgb(var(--accent))]'
                  : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]'
              )}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 stroke-[2.2]" />
              <span className="text-[10.5px] font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

