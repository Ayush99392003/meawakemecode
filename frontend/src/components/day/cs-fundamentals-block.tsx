'use client';

import * as React from 'react';
import {
  Cpu,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Button } from '@/components/ui/button';
import { useProgressStore } from '@/lib/stores/progress-store';
import { CsDailyModule } from '@/lib/data';
import { cn } from '@/lib/utils';

interface CsFundamentalsBlockProps {
  module: CsDailyModule;
  dayNumber: number;
}

export function CsFundamentalsBlock({ module, dayNumber }: CsFundamentalsBlockProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const { csTheoryRead, markCsTheoryRead } = useProgressStore();
  const isRead = !!csTheoryRead[dayNumber];

  return (
    <div
      id="cs-fundamentals"
      className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] overflow-hidden shadow-sm transition-all"
    >
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-950/30 via-[rgb(var(--surface-raised))] to-indigo-950/20 border-b border-[rgb(var(--border))] flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Milestone badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-widest">
              02 / CS Fund
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-wide">
              {module.domain}
            </span>
            <span className="text-[11px] text-[rgb(var(--text-muted))]">
              Day {dayNumber} Core Engineering Concept
            </span>
            {isRead && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Read & Verified
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[rgb(var(--text-primary))] flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400 shrink-0" />
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
          {/* Mental Model Box */}
          <div className="p-3.5 sm:p-4 rounded-[var(--radius-md)] bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">
                  Core Invariant & Mental Model
                </h4>
                <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
                  {module.mentalModel}
                </p>
              </div>
            </div>
          </div>

          {/* Deep Details (Markdown + KaTeX Math) */}
          <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-[rgb(var(--text-secondary))] space-y-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                h3: ({ children }) => (
                  <h4 className="text-sm sm:text-base font-bold text-[rgb(var(--text-primary))] mt-4 mb-2">
                    {children}
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
              {module.details}
            </ReactMarkdown>
          </div>

          {/* Real-World Production Failure & Fix */}
          <div className="p-3.5 sm:p-4 rounded-[var(--radius-md)] bg-rose-500/10 border border-rose-500/30">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1">
                  Production Incident & Failure Mode
                </h4>
                <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed">
                  {module.failureCase}
                </p>
              </div>
            </div>
          </div>

          {/* Key Interview Q&A Accordion */}
          {module.interviewQuestions && module.interviewQuestions.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[rgb(var(--border))]">
              <h4 className="text-xs font-bold text-[rgb(var(--text-primary))] uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>High-Yield Interview Questions</span>
              </h4>
              <div className="space-y-2">
                {module.interviewQuestions.map((qa, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-[var(--radius-md)] bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] space-y-1.5"
                  >
                    <p className="text-xs font-semibold text-[rgb(var(--text-primary))]">
                      Q: {qa.q}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed pl-3 border-l-2 border-blue-400/40">
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
              Milestone 2 of 5: Review theory thoroughly before attempting coding problems.
            </span>
            <Button
              size="sm"
              variant={isRead ? 'secondary' : 'primary'}
              onClick={() => markCsTheoryRead(dayNumber)}
            >
              <CheckCircle2 className={cn('w-4 h-4', isRead ? 'text-emerald-400' : '')} />
              <span>{isRead ? 'Marked as Read' : 'Mark CS Module Read'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

