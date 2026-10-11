'use client';

import * as React from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Clock,
  Sparkles,
  Code2,
  Cpu,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/common/markdown-renderer';
import { useProgressStore } from '@/lib/stores/progress-store';
import { useSettingsStore, PreferredLanguage } from '@/lib/stores/settings-store';
import { getTheoryForDay } from '@/lib/theory-db';
import { cn } from '@/lib/utils';

export interface TheoryBlockProps {
  dayNumber: number;
  theme: string;
  summary: string;
  readTimeMinutes?: number;
}

export function TheoryBlock({
  dayNumber,
  theme,
  summary,
}: TheoryBlockProps) {
  const { theoryRead, markTheoryRead } = useProgressStore();
  const { preferredLanguage, setPreferredLanguage } = useSettingsStore();

  const isRead = !!theoryRead[dayNumber];
  const [isOpen, setIsOpen] = React.useState(!isRead);
  const [copied, setCopied] = React.useState(false);

  const theory = getTheoryForDay(dayNumber);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentSnippet = theory.snippets[preferredLanguage] || theory.snippets.cpp;

  return (
    <div className="border border-[rgb(var(--border))] rounded-[var(--radius-md)] bg-[rgb(var(--surface))] overflow-hidden shadow-[var(--shadow-soft)]">
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[rgb(var(--surface-raised))] transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[rgb(var(--accent)/0.1)] text-[rgb(var(--accent))] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Milestone badge */}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-widest">
                01 / DSA
              </span>
              <h3 className="font-bold text-sm sm:text-base text-[rgb(var(--text-primary))]">
                Mastery Theory &amp; Mechanics: {theme}
              </h3>
              {isRead && (
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-[rgb(var(--success))] bg-[rgb(var(--success)/0.12)] px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3 stroke-[3]" /> Read
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-muted))] mt-0.5">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" /> ~{theory.readTimeMinutes} min deep-dive
              </span>
              <span>•</span>
              <span className="font-mono text-[rgb(var(--accent))]">
                In-Depth Architecture, Scenario Walkthrough &amp; Code
              </span>
            </div>
          </div>
        </div>

        <div className="text-[rgb(var(--text-secondary))]">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Comprehensive Markdown Theory */}
      {isOpen && (
        <div className="p-4 sm:p-6 border-t border-[rgb(var(--border))] space-y-6 text-sm animate-fadeIn">
          {/* Multi-Language Quick Code Section */}
          <div className="p-4 rounded-[var(--radius-md)] bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-primary))] flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[rgb(var(--accent))]" />
                Production Implementation Template
              </span>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-0.5 rounded bg-[rgb(var(--surface))] border border-[rgb(var(--border))]">
                  {(
                    [
                      ['cpp', 'C++'],
                      ['java', 'Java'],
                      ['python', 'Python'],
                    ] as const
                  ).map(([langKey, label]) => (
                    <button
                      key={langKey}
                      onClick={() => setPreferredLanguage(langKey as PreferredLanguage)}
                      className={cn(
                        'px-2 py-0.5 text-xs font-semibold rounded transition-colors cursor-pointer',
                        preferredLanguage === langKey
                          ? 'bg-[rgb(var(--accent))] text-white'
                          : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopy(currentSnippet.code)}
                  className="h-7 text-xs"
                >
                  {copied ? <Check className="w-3 h-3 text-[rgb(var(--success))]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <pre className="p-3.5 rounded-[var(--radius-sm)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] font-mono text-xs text-[rgb(var(--text-primary))] overflow-x-auto leading-relaxed">
              <code>{currentSnippet.code}</code>
            </pre>

            <p className="text-[11.5px] text-[rgb(var(--text-muted))] italic flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-[rgb(var(--accent))]" />
              {currentSnippet.notes}
            </p>
          </div>

          {/* Render Full Markdown Body */}
          <div className="pt-2">
            <MarkdownRenderer content={theory.markdownContent} />
          </div>

          {/* Action button */}
          <div className="flex items-center justify-between pt-4 border-t border-[rgb(var(--border))]">
            <span className="text-xs text-[rgb(var(--text-muted))]">
              Master the invariant before writing the code.
            </span>
            <Button
              size="sm"
              variant={isRead ? 'secondary' : 'primary'}
              onClick={(e) => {
                e.stopPropagation();
                markTheoryRead(dayNumber);
              }}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isRead ? 'Theory Completed' : 'Mark Theory as Read'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
