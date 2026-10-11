'use client';

import * as React from 'react';
import {
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Scale,
  HelpCircle,
  Network,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Button } from '@/components/ui/button';
import { useProgressStore } from '@/lib/stores/progress-store';
import { SystemDesignDailyModule } from '@/lib/data';
import { cn } from '@/lib/utils';

interface SystemDesignBlockProps {
  module: SystemDesignDailyModule;
  dayNumber: number;
}

export function SystemDesignBlock({ module, dayNumber }: SystemDesignBlockProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const { systemDesignRead, markSystemDesignRead } = useProgressStore();
  const isRead = !!systemDesignRead[dayNumber];

  return (
    <div
      id="system-design"
      className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] overflow-hidden shadow-sm transition-all"
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950/30 via-[rgb(var(--surface-raised))] to-indigo-950/20 border-b border-[rgb(var(--border))] flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Milestone badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-widest">
              03 / Sys Design
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase tracking-wide">
              System Design & Architecture
            </span>
            <span className="text-[11px] text-[rgb(var(--text-muted))]">
              Day {dayNumber} Distributed Scale Module
            </span>
            {isRead && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Architecture Cleared
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400 shrink-0" />
            <span>{module.title}</span>
          </h3>

          <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
            {module.summary}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-raised))] transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Architecture Content (Markdown + KaTeX Math) */}
          <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-[rgb(var(--text-secondary))] space-y-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h3: ({ children }) => (
                  <h4 className="text-sm sm:text-base font-bold text-[rgb(var(--text-primary))] mt-4 mb-2 flex items-center gap-2">
                    <Network className="w-4 h-4 text-purple-400" />
                    <span>{children}</span>
                  </h4>
                ),
                ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 my-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5 my-2">{children}</ol>,
                code: ({ inline, className, children, ...props }: any) => {
                  if (inline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-[rgb(var(--surface-raised))] text-[rgb(var(--accent))] font-mono text-xs border border-[rgb(var(--border))]">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <div className="my-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] p-3 overflow-x-auto">
                      <pre className="font-mono text-xs text-[rgb(var(--text-primary))]">
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                },
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface-raised)/0.3)] shadow-sm">
                    <table className="w-full text-xs text-left border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-[rgb(var(--surface-raised))] border-b border-[rgb(var(--border))] font-semibold text-[rgb(var(--text-primary))]">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-[rgb(var(--border))]">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-[rgb(var(--surface-raised)/0.5)] transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-3.5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--text-primary))] border-r border-[rgb(var(--border)/0.5)] last:border-r-0">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3.5 py-2.5 text-[rgb(var(--text-secondary))] font-mono text-xs border-r border-[rgb(var(--border)/0.5)] last:border-r-0">
                    {children}
                  </td>
                ),
              }}
            >
              {module.architecture}
            </ReactMarkdown>
          </div>

          {/* Trade-offs & Bottlenecks Card */}
          <div className="p-3.5 sm:p-4 rounded-[var(--radius-md)] bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-start gap-2.5">
              <Scale className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
                  System Bottlenecks & Critical Trade-offs
                </h4>
                <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                  {module.tradeoffs}
                </p>
              </div>
            </div>
          </div>

          {/* High-Yield System Design Q&A */}
          {module.interviewQuestions && module.interviewQuestions.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[rgb(var(--border))]">
              <h4 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Production Interview Scenarios</span>
              </h4>
              <div className="space-y-2">
                {module.interviewQuestions.map((qa, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-[var(--radius-md)] bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] space-y-1.5"
                  >
                    <p className="text-xs font-semibold text-[rgb(var(--text-primary))]">
                      Scenario: {qa.q}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed pl-3 border-l-2 border-purple-400/40">
                      {qa.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mark Read CTA Button */}
          <div className="flex items-center justify-between pt-2 border-t border-[rgb(var(--border))]">
            <span className="text-xs text-[rgb(var(--text-muted))]">
              Milestone 3 of 5: Understand architectural scale before coding solutions.
            </span>
            <Button
              size="sm"
              variant={isRead ? 'secondary' : 'primary'}
              onClick={() => markSystemDesignRead(dayNumber)}
            >
              <CheckCircle2 className={cn('w-4 h-4', isRead ? 'text-emerald-400' : '')} />
              <span>{isRead ? 'Marked as Read' : 'Mark System Design Read'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

