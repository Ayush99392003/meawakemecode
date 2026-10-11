'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, Clock, ArrowRight } from 'lucide-react';
import { getLibraryBySection } from '@/lib/data';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';

export function SectionTopicsClient({ sectionId }: { sectionId: string }) {
  const topics = getLibraryBySection(sectionId);

  const sectionTitles: Record<string, string> = {
    dsa: 'Data Structures & Algorithms',
    os: 'Operating Systems',
    dbms: 'Database Management Systems',
    cn: 'Computer Networks',
    oop: 'Object-Oriented Programming',
    system_design: 'System Design Fundamentals',
  };

  const title = sectionTitles[sectionId] || sectionId.toUpperCase();

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/library"
          className="flex items-center gap-1.5 text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>All Library Sections</span>
        </Link>
      </div>

      <div>
        <span className="text-xs font-mono font-semibold text-[rgb(var(--accent))] uppercase">
          {sectionId.toUpperCase()} SECTION
        </span>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))] mt-0.5">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] mt-1">
          {topics.length} curated deep-dive topic guides with practical interview Q&As.
        </p>
      </div>

      {/* Topics list */}
      {topics.length === 0 ? (
        <div className="p-8 text-center rounded-[var(--radius-md)] border border-dashed border-[rgb(var(--border))] text-sm text-[rgb(var(--text-muted))]">
          No articles found for this section yet.
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => {
            const cleanSlug = topic.slug.includes('/')
              ? topic.slug.split('/')[1]
              : topic.slug;

            return (
              <Link key={topic.slug} href={`/library/${sectionId}/${cleanSlug}`}>
                <Card
                  variant="interactive"
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {topic.tags.map((tag) => (
                        <Chip key={tag} variant="neutral">
                          {tag}
                        </Chip>
                      ))}
                      <span className="text-xs text-[rgb(var(--text-muted))] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> {topic.readTimeMinutes}m read
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--accent))] transition-colors">
                      {topic.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--accent))] self-end sm:self-center shrink-0">
                    <span>Read Topic</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

