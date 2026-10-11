'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Search as SearchIcon,
  X,
  ExternalLink,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Fuse from 'fuse.js';
import {
  problems,
  days,
  libraryPages,
  ProblemData,
  DayData,
  LibraryPageData,
} from '@/lib/data';
import { Chip } from '@/components/ui/chip';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function SearchPage() {
  const [query, setQuery] = React.useState('');
  const [filterPlatform, setFilterPlatform] = React.useState<'ALL' | 'LC' | 'CF'>('ALL');

  // Fuse search instances
  const fuseProblems = React.useMemo(() => {
    return new Fuse(problems, {
      keys: ['title', 'tags', 'expectedPattern'],
      threshold: 0.35,
    });
  }, []);

  const fuseDays = React.useMemo(() => {
    return new Fuse(days, {
      keys: ['theme', 'summary'],
      threshold: 0.35,
    });
  }, []);

  const fuseLibrary = React.useMemo(() => {
    return new Fuse(libraryPages, {
      keys: ['title', 'tags', 'section'],
      threshold: 0.35,
    });
  }, []);

  const searchResults = React.useMemo(() => {
    if (!query.trim()) {
      return {
        matchedProblems: problems.slice(0, 10),
        matchedDays: days.slice(0, 5),
        matchedLibrary: libraryPages.slice(0, 5),
      };
    }

    let pRes = fuseProblems.search(query).map((r) => r.item);
    if (filterPlatform !== 'ALL') {
      pRes = pRes.filter((p) => p.platform === filterPlatform);
    }

    const dRes = fuseDays.search(query).map((r) => r.item);
    const lRes = fuseLibrary.search(query).map((r) => r.item);

    return {
      matchedProblems: pRes,
      matchedDays: dRes,
      matchedLibrary: lRes,
    };
  }, [query, filterPlatform, fuseProblems, fuseDays, fuseLibrary]);

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Search Input Box */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-muted))]" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 150 problems, 30 days, or CS fundamentals topics..."
          className="w-full pl-12 pr-10 py-3.5 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm sm:text-base text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Platform Filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[rgb(var(--text-muted))] font-mono">Platform:</span>
        {(['ALL', 'LC', 'CF'] as const).map((plat) => (
          <button
            key={plat}
            onClick={() => setFilterPlatform(plat)}
            className="cursor-pointer"
          >
            <Chip variant={filterPlatform === plat ? 'lc' : 'neutral'}>
              {plat === 'ALL' ? 'All Platforms' : plat === 'LC' ? 'LeetCode' : 'Codeforces'}
            </Chip>
          </button>
        ))}
      </div>

      {/* Results Groups */}
      <div className="space-y-6">
        {/* Problems Group */}
        {searchResults.matchedProblems.length > 0 && (
          <div className="space-y-2.5">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[rgb(var(--text-muted))] flex items-center gap-1.5">
              <span>Problems ({searchResults.matchedProblems.length})</span>
            </h2>

            <div className="space-y-2">
              {searchResults.matchedProblems.slice(0, 15).map((prob) => (
                <div
                  key={prob.id}
                  className="p-3 rounded-[var(--radius-sm)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex items-center justify-between gap-3 hover:border-[rgb(var(--accent))] transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Chip variant={prob.platform === 'LC' ? 'lc' : 'cf'}>
                        {prob.platform}
                      </Chip>
                      <Chip variant="neutral">{prob.difficulty}</Chip>
                      {prob.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[11px] text-[rgb(var(--text-muted))]">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <a
                      href={prob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-semibold text-[rgb(var(--text-primary))] hover:text-[rgb(var(--accent))] flex items-center gap-1"
                    >
                      <span>{prob.title}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>

                  <a
                    href={prob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[rgb(var(--accent))] hover:underline shrink-0"
                  >
                    Solve
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Days Group */}
        {searchResults.matchedDays.length > 0 && (
          <div className="space-y-2.5">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[rgb(var(--text-muted))]">
              Day Curriculums ({searchResults.matchedDays.length})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {searchResults.matchedDays.slice(0, 6).map((day) => (
                <Link key={day.id} href={`/day/${day.number}`}>
                  <Card
                    variant="interactive"
                    className="p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-semibold text-[rgb(var(--accent))]">
                        DAY {day.number}
                      </span>
                      <h3 className="text-xs font-bold text-[rgb(var(--text-primary))] line-clamp-1">
                        {day.theme}
                      </h3>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[rgb(var(--text-muted))]" />
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Library Topics Group */}
        {searchResults.matchedLibrary.length > 0 && (
          <div className="space-y-2.5">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[rgb(var(--text-muted))]">
              Library Articles ({searchResults.matchedLibrary.length})
            </h2>

            <div className="space-y-2">
              {searchResults.matchedLibrary.slice(0, 6).map((page) => {
                const cleanSlug = page.slug.includes('/')
                  ? page.slug.split('/')[1]
                  : page.slug;

                return (
                  <Link
                    key={page.slug}
                    href={`/library/${page.section}/${cleanSlug}`}
                  >
                    <div className="p-3 rounded-[var(--radius-sm)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex items-center justify-between gap-3 hover:border-[rgb(var(--accent))] transition-colors">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[rgb(var(--text-muted))]">
                          {page.section}
                        </span>
                        <h3 className="text-xs sm:text-sm font-semibold text-[rgb(var(--text-primary))]">
                          {page.title}
                        </h3>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[rgb(var(--accent))]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

