'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bookmark, Star, Trash2, ExternalLink, ArrowRight } from 'lucide-react';
import { useBookmarkStore, BookmarkType } from '@/lib/stores/bookmark-store';
import {
  getProblemById,
  getDayByNumber,
  libraryPages,
} from '@/lib/data';
import { Chip } from '@/components/ui/chip';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function BookmarksPage() {
  const { bookmarks, removeBookmark, clearAll } = useBookmarkStore();
  const [activeTab, setActiveTab] = React.useState<BookmarkType>('problem');
  const [search, setSearch] = React.useState('');

  const allItems = Object.values(bookmarks);
  const filteredByType = allItems.filter((b) => b.type === activeTab);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
            Bookmarks & Saved Items
          </h1>
          <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] mt-0.5">
            Quickly revisit difficult patterns, key interview questions, and favorite problems.
          </p>
        </div>

        {allItems.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm('Clear all bookmarks?')) clearAll();
            }}
            className="text-[rgb(var(--danger))] hover:bg-[rgb(var(--danger)/0.1)] self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[rgb(var(--border))] pb-2">
        {(
          [
            ['problem', 'Problems'],
            ['day', 'Days'],
            ['library', 'Library Guides'],
          ] as const
        ).map(([type, label]) => {
          const count = allItems.filter((b) => b.type === type).length;
          const isActive = activeTab === type;
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={cn(
                'px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-[var(--radius-sm)] transition-colors flex items-center gap-2 cursor-pointer',
                isActive
                  ? 'bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))]'
                  : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-raised))]'
              )}
            >
              <span>{label}</span>
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-[rgb(var(--surface-raised))]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content list */}
      {filteredByType.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap the star icon on any problem or library article to save it here for rapid interview review."
          action={
            <Link href="/sheet">
              <Button size="sm" variant="primary">
                Browse Curriculum
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredByType.map((item) => {
            if (item.type === 'problem') {
              const problem = getProblemById(item.id);
              if (!problem) return null;

              return (
                <Card
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Chip variant={problem.platform === 'LC' ? 'lc' : 'cf'}>
                        {problem.platform}
                      </Chip>
                      <Chip variant="neutral">{problem.difficulty}</Chip>
                      <span className="text-xs text-[rgb(var(--text-muted))] font-mono">
                        {problem.expectedPattern || 'Algorithm'}
                      </span>
                    </div>

                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm sm:text-base text-[rgb(var(--text-primary))] hover:text-[rgb(var(--accent))] flex items-center gap-1.5"
                    >
                      <span>{problem.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => removeBookmark(item.id)}
                      className="p-2 rounded-lg text-[rgb(var(--text-muted))] hover:text-[rgb(var(--danger))] hover:bg-[rgb(var(--danger)/0.1)] transition-colors"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            }

            if (item.type === 'day') {
              const day = getDayByNumber(Number(item.id));
              if (!day) return null;

              return (
                <Link key={item.id} href={`/day/${day.number}`}>
                  <Card
                    variant="interactive"
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-mono font-semibold text-[rgb(var(--accent))]">
                        DAY {day.number}
                      </span>
                      <h3 className="font-semibold text-sm sm:text-base text-[rgb(var(--text-primary))]">
                        {day.theme}
                      </h3>
                      <p className="text-xs text-[rgb(var(--text-secondary))] line-clamp-1">
                        {day.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeBookmark(item.id);
                        }}
                        className="p-2 rounded-lg text-[rgb(var(--text-muted))] hover:text-[rgb(var(--danger))] hover:bg-[rgb(var(--danger)/0.1)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ArrowRight className="w-4 h-4 text-[rgb(var(--accent))]" />
                    </div>
                  </Card>
                </Link>
              );
            }

            if (item.type === 'library') {
              const page = libraryPages.find(
                (p) => p.slug === item.id || p.slug.endsWith(`/${item.id}`)
              );
              if (!page) return null;

              const cleanSlug = page.slug.includes('/')
                ? page.slug.split('/')[1]
                : page.slug;

              return (
                <Link
                  key={item.id}
                  href={`/library/${page.section}/${cleanSlug}`}
                >
                  <Card
                    variant="interactive"
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <Chip variant="neutral">{page.section.toUpperCase()}</Chip>
                      <h3 className="font-semibold text-sm sm:text-base text-[rgb(var(--text-primary))] mt-1">
                        {page.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeBookmark(item.id);
                        }}
                        className="p-2 rounded-lg text-[rgb(var(--text-muted))] hover:text-[rgb(var(--danger))] hover:bg-[rgb(var(--danger)/0.1)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ArrowRight className="w-4 h-4 text-[rgb(var(--accent))]" />
                    </div>
                  </Card>
                </Link>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

