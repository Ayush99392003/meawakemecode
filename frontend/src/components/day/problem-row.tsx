'use client';

import * as React from 'react';
import { ExternalLink, Star, ChevronDown, ChevronUp, StickyNote, HelpCircle, RefreshCw } from 'lucide-react';
import { ProblemData } from '@/lib/data';
import { useProgressStore } from '@/lib/stores/progress-store';
import { useBookmarkStore } from '@/lib/stores/bookmark-store';
import { Checkbox } from '@/components/ui/checkbox';
import { Chip } from '@/components/ui/chip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ProblemRowProps {
  problem: ProblemData;
  dayNumber: number;
  index: number;
}

export function ProblemRow({ problem, dayNumber, index }: ProblemRowProps) {
  const { problems, startProblem, solveProblem, unsolveProblem, markRevisit, setNote } =
    useProgressStore();
  const { isBookmarked, toggleBookmark } = useBookmarkStore();

  const [showHint, setShowHint] = React.useState(false);
  const [showNotes, setShowNotes] = React.useState(false);
  const [noteText, setNoteText] = React.useState('');

  const progress = problems[problem.id];
  const isSolved = progress?.status === 'solved';
  const isStarted = progress?.status === 'started';
  const isRevisit = progress?.status === 'revisit';
  const bookmarked = isBookmarked(problem.id);

  React.useEffect(() => {
    if (progress?.note) {
      setNoteText(progress.note);
    }
  }, [progress?.note]);

  const handleCheckbox = (checked: boolean) => {
    if (checked) {
      solveProblem(problem.id, dayNumber);
    } else {
      unsolveProblem(problem.id);
    }
  };

  const handleSolveClick = () => {
    if (!isSolved) {
      startProblem(problem.id);
    }
    window.open(problem.url, '_blank', 'noopener,noreferrer');
  };

  const handleNoteSave = (val: string) => {
    setNoteText(val);
    setNote(problem.id, val);
  };

  const difficultyVariant = () => {
    const d = problem.difficulty.toLowerCase();
    if (d.includes('easy')) return 'easy';
    if (d.includes('medium')) return 'medium';
    if (d.includes('hard')) return 'hard';
    return 'neutral';
  };

  return (
    <div
      className={cn(
        'group border rounded-[var(--radius-md)] p-3 sm:p-4 transition-all duration-150',
        isSolved
          ? 'bg-[rgb(var(--success-bg)/0.25)] border-[rgb(var(--success)/0.25)]'
          : isStarted
          ? 'bg-[rgb(var(--surface))] border-[rgb(var(--warning)/0.3)] shadow-sm'
          : 'bg-[rgb(var(--surface))] border-[rgb(var(--border))] hover:border-[rgb(var(--text-muted))] shadow-[var(--shadow-soft)]'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left side: Checkbox + info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Checkbox
            checked={isSolved}
            onCheckedChange={handleCheckbox}
            aria-label={`Problem ${index + 1} of 5: ${problem.title}, ${isSolved ? 'solved' : 'not solved'}`}
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Chip variant={problem.platform === 'LC' ? 'lc' : 'cf'}>
                {problem.platform}
              </Chip>
              <Chip variant={difficultyVariant()}>{problem.difficulty}</Chip>
              {problem.tags.slice(0, 2).map((tag) => (
                <Chip key={tag} variant="neutral">
                  {tag}
                </Chip>
              ))}
              {problem.tags.length > 2 && (
                <Badge variant="default">+{problem.tags.length - 2}</Badge>
              )}
              {isStarted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[rgb(var(--warning))] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--warning))] animate-pulse" />
                  In Progress
                </span>
              )}
              {isRevisit && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[rgb(var(--accent))] font-mono">
                  <RefreshCw className="w-3 h-3" />
                  Revisit
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <a
                href={problem.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => !isSolved && startProblem(problem.id)}
                className={cn(
                  'font-medium text-sm sm:text-base hover:text-[rgb(var(--accent))] transition-colors group-hover:underline inline-flex items-center gap-1.5',
                  isSolved && 'line-through text-[rgb(var(--text-muted))]'
                )}
              >
                <span>{problem.title}</span>
                <ExternalLink className="w-3 h-3 opacity-60 inline shrink-0" />
              </a>
            </div>

            {/* Expected complexity */}
            {(problem.expectedTimeComplexity || problem.expectedSpaceComplexity) && (
              <p className="text-xs text-[rgb(var(--text-muted))] font-mono mt-1">
                Time: {problem.expectedTimeComplexity || 'O(N)'} | Space:{' '}
                {problem.expectedSpaceComplexity || 'O(1)'}
              </p>
            )}
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {problem.hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              aria-label="Toggle hint"
              className={cn(
                'p-2 rounded-lg border border-[rgb(var(--border))] text-xs font-medium transition-colors hover:bg-[rgb(var(--surface-raised))]',
                showHint ? 'bg-[rgb(var(--warning)/0.12)] text-[rgb(var(--warning))] border-[rgb(var(--warning)/0.3)]' : 'text-[rgb(var(--text-secondary))]'
              )}
              title="Hint"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowNotes(!showNotes)}
            aria-label="Toggle notes"
            className={cn(
              'p-2 rounded-lg border border-[rgb(var(--border))] text-xs font-medium transition-colors hover:bg-[rgb(var(--surface-raised))]',
              showNotes || noteText ? 'text-[rgb(var(--accent))] border-[rgb(var(--accent)/0.3)] bg-[rgb(var(--accent)/0.08)]' : 'text-[rgb(var(--text-secondary))]'
            )}
            title="Notes"
          >
            <StickyNote className="w-4 h-4" />
          </button>

          <button
            onClick={() => toggleBookmark(problem.id, 'problem')}
            aria-label="Bookmark problem"
            className={cn(
              'p-2 rounded-lg border border-[rgb(var(--border))] text-xs font-medium transition-colors hover:bg-[rgb(var(--surface-raised))]',
              bookmarked ? 'text-[rgb(var(--warning))] fill-[rgb(var(--warning))] border-[rgb(var(--warning)/0.3)]' : 'text-[rgb(var(--text-secondary))]'
            )}
            title="Bookmark"
          >
            <Star className={cn('w-4 h-4', bookmarked && 'fill-current')} />
          </button>

          <Button
            size="sm"
            variant={isSolved ? 'secondary' : 'primary'}
            onClick={handleSolveClick}
          >
            <span>{isSolved ? 'Re-solve' : 'Solve'}</span>
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Expandable Hint Section */}
      {showHint && problem.hint && (
        <div className="mt-3 p-3 bg-[rgb(var(--warning-bg)/0.2)] border border-[rgb(var(--warning)/0.25)] rounded-[var(--radius-sm)] text-xs text-[rgb(var(--text-secondary))] animate-fadeIn">
          <p className="font-semibold text-[rgb(var(--warning))] mb-1 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            Hint (Try for 20 minutes first)
          </p>
          <p>{problem.hint}</p>
          {problem.expectedPattern && (
            <p className="mt-1.5 text-[11px] font-mono text-[rgb(var(--text-muted))]">
              Key Pattern: {problem.expectedPattern}
            </p>
          )}
        </div>
      )}

      {/* Expandable Notes Section */}
      {showNotes && (
        <div className="mt-3 p-3 bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] rounded-[var(--radius-sm)] animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-[rgb(var(--text-secondary))] flex items-center gap-1">
              <StickyNote className="w-3.5 h-3.5 text-[rgb(var(--accent))]" />
              Personal Notes & Key Takeaways
            </label>
            <span className="text-[10px] text-[rgb(var(--text-muted))] font-mono">
              Auto-saved
            </span>
          </div>
          <textarea
            value={noteText}
            onChange={(e) => handleNoteSave(e.target.value)}
            placeholder="Add personal notes, edge cases to remember, or complexity reflections..."
            className="w-full text-xs p-2.5 rounded-[var(--radius-sm)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--ring))] resize-y min-h-[60px]"
          />
        </div>
      )}
    </div>
  );
}

