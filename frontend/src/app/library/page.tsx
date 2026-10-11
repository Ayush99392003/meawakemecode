'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Binary,
  Cpu,
  Database,
  Globe,
  Layers,
  Server,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { libraryPages, LibraryPageData } from '@/lib/data';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';

const SECTIONS = [
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    description: 'Core complexity analysis, recursive tree mechanics, pointer patterns, and amortized bounds.',
    icon: Binary,
  },
  {
    id: 'os',
    name: 'Operating Systems',
    description: 'Processes, threads, deadlocks, virtual memory, paging, TLB, and CPU scheduling.',
    icon: Cpu,
  },
  {
    id: 'dbms',
    name: 'Database Management Systems',
    description: 'ACID properties, transactions, isolation levels, B+ trees, indexing, and normalization.',
    icon: Database,
  },
  {
    id: 'cn',
    name: 'Computer Networks',
    description: 'OSI & TCP/IP stack, 3-way handshake, DNS, HTTP/HTTPS, congestion control, and WebSockets.',
    icon: Globe,
  },
  {
    id: 'oop',
    name: 'Object-Oriented Programming',
    description: 'SOLID principles, polymorphism, encapsulation, inheritance, and GoF design patterns.',
    icon: Layers,
  },
  {
    id: 'system_design',
    name: 'System Design Fundamentals',
    description: 'High-level architectures, caching strategies, load balancing, sharding, and CAP theorem.',
    icon: Server,
  },
];

export default function LibraryPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[rgb(var(--accent))] uppercase tracking-wider mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Core Fundamentals & CS Theory</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
          Interview Knowledge Library
        </h1>
        <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] mt-1 max-w-2xl">
          High-yield theory notes, architectural trade-offs, and top interview questions crafted for technical screenings.
        </p>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const sectionPages = libraryPages.filter((p) => p.section === sec.id);
          const pageCount = sectionPages.length;

          return (
            <Link key={sec.id} href={`/library/${sec.id}`}>
              <Card
                variant="interactive"
                className="h-full flex flex-col justify-between p-5 space-y-4"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <h2 className="font-bold text-base text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--accent))] transition-colors">
                      {sec.name}
                    </h2>
                    <p className="text-xs text-[rgb(var(--text-secondary))] mt-1.5 leading-relaxed">
                      {sec.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[rgb(var(--border))] flex items-center justify-between text-xs text-[rgb(var(--text-muted))]">
                  <span>{pageCount > 0 ? `${pageCount} articles` : 'Guides'}</span>
                  <div className="flex items-center gap-1 font-medium text-[rgb(var(--accent))]">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

