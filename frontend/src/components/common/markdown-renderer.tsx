'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className={cn('prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-[rgb(var(--text-secondary))] space-y-3', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))] pb-2 border-b border-[rgb(var(--border))] mt-6 mb-3">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-bold text-[rgb(var(--text-primary))] mt-5 mb-2 pb-1 border-b border-[rgb(var(--border))]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-semibold text-[rgb(var(--text-primary))] mt-4 mb-1.5 text-[rgb(var(--accent))]">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))] mt-3 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-2 leading-relaxed text-[rgb(var(--text-secondary))]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 my-2.5 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 my-2.5 space-y-1 font-mono">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed text-[rgb(var(--text-secondary))]">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[rgb(var(--accent))] pl-4 py-1.5 my-3 bg-[rgb(var(--accent)/0.06)] rounded-r-[var(--radius-sm)] italic text-[rgb(var(--text-primary))]">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--surface-raised)/0.3)] shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
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
            <th className="px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-wider text-[rgb(var(--text-primary))] border-r border-[rgb(var(--border)/0.5)] last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 text-[rgb(var(--text-secondary))] font-mono text-xs border-r border-[rgb(var(--border)/0.5)] last:border-r-0">
              {children}
            </td>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && match) {
              const lang = match[1];
              return (
                <div className="relative my-3 rounded-[var(--radius-sm)] border border-[rgb(var(--border))] bg-[rgb(var(--surface-raised))] overflow-hidden group">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[rgb(var(--surface))] border-b border-[rgb(var(--border))] text-[11px] font-mono text-[rgb(var(--text-muted))]">
                    <span className="uppercase font-semibold text-[rgb(var(--accent))]">{lang}</span>
                    <button
                      onClick={() => handleCopy(codeString, 0)}
                      className="flex items-center gap-1 hover:text-[rgb(var(--text-primary))] transition-colors cursor-pointer"
                      title="Copy code"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-3.5 overflow-x-auto font-mono text-xs text-[rgb(var(--text-primary))] leading-relaxed">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }

            return (
              <code className="px-1.5 py-0.5 rounded bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] font-mono text-xs text-[rgb(var(--accent))]">
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

