import * as React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--border))] py-8 mt-12 bg-[rgb(var(--surface)/0.3)]">
      <div className="max-w-[960px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[rgb(var(--text-muted))]">
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
          <span className="font-medium text-[rgb(var(--text-primary))]">meawakemecode</span>
          <span className="hidden sm:inline">•</span>
          <span>
            Created by{' '}
            <a
              href="mailto:ayush20039939@gmail.com"
              className="text-[rgb(var(--accent))] hover:underline font-medium"
            >
              Ayush Agarwal
            </a>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-[rgb(var(--text-primary))] transition-colors">
            About
          </Link>
          <Link href="/privacy" className="hover:text-[rgb(var(--text-primary))] transition-colors">
            Privacy
          </Link>
          <Link href="/settings" className="hover:text-[rgb(var(--text-primary))] transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}

