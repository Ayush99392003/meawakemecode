'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Bookmark,
} from 'lucide-react';
import { libraryPages } from '@/lib/data';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/common/markdown-renderer';
import { useBookmarkStore } from '@/lib/stores/bookmark-store';
import { cn } from '@/lib/utils';

export function TopicDetailClient({
  section,
  slug,
}: {
  section: string;
  slug: string;
}) {
  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const [expandedQAs, setExpandedQAs] = React.useState<Record<number, boolean>>({});

  const page = libraryPages.find(
    (p) =>
      p.slug === `${section}/${slug}` ||
      p.slug === slug ||
      p.slug.endsWith(`/${slug}`)
  );

  const bookmarked = page ? isBookmarked(page.slug) : false;

  const toggleQA = (idx: number) => {
    setExpandedQAs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!page) {
    return (
      <div className="max-w-[760px] mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Article not found</h2>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          The requested technical topic could not be located.
        </p>
        <Link href={`/library/${section}`}>
          <Button variant="secondary">Back to {section.toUpperCase()}</Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-[760px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href={`/library/${section}`}
          className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to {section.toUpperCase()}</span>
        </Link>

        <button
          onClick={() => toggleBookmark(page.slug, 'library')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
            bookmarked
              ? 'border-[rgb(var(--warning)/0.4)] text-[rgb(var(--warning))] bg-[rgb(var(--warning)/0.1)]'
              : 'border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-raised))]'
          )}
        >
          <Bookmark className={cn('w-3.5 h-3.5', bookmarked && 'fill-current')} />
          <span>{bookmarked ? 'Saved' : 'Bookmark'}</span>
        </button>
      </div>

      {/* Article Header */}
      <header className="space-y-3 pb-6 border-b border-[rgb(var(--border))]">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="neutral">{section.toUpperCase()}</Chip>
          {page.tags.map((t) => (
            <Chip key={t} variant="neutral">
              {t}
            </Chip>
          ))}
          <span className="text-xs text-[rgb(var(--text-muted))] flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5" /> {page.readTimeMinutes} min read
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[rgb(var(--text-primary))] leading-tight">
          {page.title}
        </h1>
      </header>

      {/* Article Body */}
      <MarkdownRenderer content={page.content} />

      {/* Interview Questions & Answers Accordion */}
      {page.interviewQuestions && page.interviewQuestions.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-[rgb(var(--border))]">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[rgb(var(--accent))]" />
            <h2 className="text-base sm:text-lg font-bold text-[rgb(var(--text-primary))]">
              Must-Know Interview Questions & Answers
            </h2>
          </div>

          <div className="space-y-3">
            {page.interviewQuestions.map((qa, idx) => {
              const isOpen = !!expandedQAs[idx];
              return (
                <div
                  key={idx}
                  className="border border-[rgb(var(--border))] rounded-[var(--radius-md)] bg-[rgb(var(--surface))] overflow-hidden"
                >
                  <button
                    onClick={() => toggleQA(idx)}
                    className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-[rgb(var(--surface-raised))] transition-colors select-none cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-[rgb(var(--text-primary))]">
                      Q{idx + 1}: {qa.q}
                    </span>
                    <span className="text-[rgb(var(--text-secondary))] shrink-0 mt-0.5">
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 text-xs sm:text-sm text-[rgb(var(--text-secondary))] leading-relaxed border-t border-[rgb(var(--border))] mt-1 bg-[rgb(var(--surface-raised)/0.5)]">
                      <p className="pt-3 font-mono text-[11px] text-[rgb(var(--accent))] uppercase font-semibold mb-1">
                        Recommended Model Answer:
                      </p>
                      <p>{qa.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom Navigation */}
      <footer className="pt-6 border-t border-[rgb(var(--border))] flex items-center justify-between">
        <Link href={`/library/${section}`}>
          <Button variant="secondary" size="sm">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to topics</span>
          </Button>
        </Link>
        <Link href="/sheet">
          <Button variant="primary" size="sm">
            <span>Continue DSA Sheet</span>
          </Button>
        </Link>
      </footer>
    </article>
  );
}

