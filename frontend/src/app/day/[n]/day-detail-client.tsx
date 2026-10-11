'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Cpu,
  Layers,
  CheckCircle2,
  Lock,
  StickyNote,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  getDayByNumber,
  getProblemsForDay,
  getCsModuleForDay,
  getSystemDesignModuleForDay,
  getMcqsForDay,
  TOTAL_DAYS,
} from '@/lib/data';
import { useProgressStore } from '@/lib/stores/progress-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { getCurrentDayNumber } from '@/lib/dates';
import { ProblemRow } from '@/components/day/problem-row';
import { TheoryBlock } from '@/components/day/theory-block';
import { CsFundamentalsBlock } from '@/components/day/cs-fundamentals-block';
import { SystemDesignBlock } from '@/components/day/system-design-block';
import { DayMcqGauntlet } from '@/components/day/day-mcq-gauntlet';
import { DayProgressStepper } from '@/components/day/day-progress-stepper';
import { NotesBox } from '@/components/day/notes-box';
import { DayCompleteModal } from '@/components/day/day-complete-modal';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { SectionConnector } from '@/components/ui/section-connector';
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';
import { calculateTrashBadge } from '@/lib/accountability';
import { TrashBadgeBanner } from '@/components/accountability/trash-badge-banner';
import { TrashBadgeModal } from '@/components/accountability/trash-badge-modal';
import { TrashBadgePill } from '@/components/accountability/trash-badge-pill';
import { cn } from '@/lib/utils';

export function DayDetailClient({ dayNumber }: { dayNumber: number }) {
  const router = useRouter();
  const day = getDayByNumber(dayNumber);

  const {
    problems,
    dayCompletions,
    theoryRead,
    csTheoryRead,
    systemDesignRead,
    mcqAnswers,
    startDate,
    completeDay,
    setNote,
  } = useProgressStore();

  const { strictMode } = useSettingsStore();

  const [activeTab, setActiveTab] = React.useState<
    'all' | 'dsa' | 'cs' | 'system_design' | 'problems' | 'mcq' | 'notes'
  >('all');
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [showTrashModal, setShowTrashModal] = React.useState(false);
  const [dayNote, setDayNote] = React.useState('');

  const trashInfo = React.useMemo(
    () => calculateTrashBadge(dayCompletions, startDate),
    [dayCompletions, startDate]
  );

  const currentDayNum = React.useMemo(() => {
    if (!startDate) return 1;
    return getCurrentDayNumber(startDate);
  }, [startDate]);

  const isLocked = strictMode && dayNumber > currentDayNum;
  const isComplete = !!dayCompletions[dayNumber];

  const dayProblems = getProblemsForDay(dayNumber);
  const solvedCount = dayProblems.filter(
    (p) => problems[p.id]?.status === 'solved'
  ).length;
  const allSolved = solvedCount === 5;

  const csModule = getCsModuleForDay(dayNumber);
  const sdModule = getSystemDesignModuleForDay(dayNumber);
  const mcqSet = getMcqsForDay(dayNumber);

  // Compute how many MCQs answered for today
  const answeredMcqsCount = React.useMemo(() => {
    let count = 0;
    const allTodayMcqs = [...mcqSet.dsa, ...mcqSet.cs, ...mcqSet.systemDesign];
    allTodayMcqs.forEach((q) => {
      if (mcqAnswers[q.id]) count++;
    });
    return count;
  }, [mcqSet, mcqAnswers]);

  const isDsaRead = !!theoryRead[dayNumber];
  const isCsRead = !!csTheoryRead[dayNumber];
  const isSdRead = !!systemDesignRead[dayNumber];
  // Require at least 15 MCQs answered across the 60 questions or all
  const isMcqSatisfied = answeredMcqsCount >= Math.min(15, mcqSet.total);

  const canMarkComplete =
    allSolved && isDsaRead && isCsRead && isSdRead && isMcqSatisfied;

  if (!day) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Day not found</h2>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          The requested day does not exist in the 30-day curriculum.
        </p>
        <Link href="/sheet">
          <Button variant="secondary">Back to Curriculum Sheet</Button>
        </Link>
      </div>
    );
  }

  const handleMarkComplete = () => {
    completeDay(dayNumber, dayNumber < currentDayNum);
    setShowCelebration(true);
  };

  const handleJumpToSection = (sectionId: string) => {
    setActiveTab('all');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Sticky Top Bar for Navigation */}
      <div className="sticky top-14 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-[rgb(var(--background)/0.92)] backdrop-blur-md border-b border-[rgb(var(--border))] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/sheet"
            className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-raised))] transition-colors"
            aria-label="Back to sheet"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[11px] font-mono font-semibold text-[rgb(var(--accent))] uppercase">
              DAY {dayNumber.toString().padStart(2, '0')} OF 30
            </span>
            <h1 className="text-sm sm:text-base font-bold text-[rgb(var(--text-primary))] line-clamp-1">
              {day.theme}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Trash Badge Pill */}
          <TrashBadgePill
            trashInfo={trashInfo}
            onClick={() => setShowTrashModal(true)}
          />

          <ProgressRing value={solvedCount} max={5} size={36} strokeWidth={4} />

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push(`/day/${Math.max(1, dayNumber - 1)}`)}
              disabled={dayNumber <= 1}
              className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-raised))] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push(`/day/${Math.min(TOTAL_DAYS, dayNumber + 1)}`)}
              disabled={
                dayNumber >= TOTAL_DAYS ||
                (strictMode && dayNumber >= currentDayNum && !isComplete)
              }
              className="p-1.5 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-raised))] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Locked Notice if strict mode applies */}
      {isLocked && (
        <Banner
          variant="warning"
          action={
            <Link href={`/day/${currentDayNum}`}>
              <Button size="sm" variant="secondary">
                Go to Day {currentDayNum}
              </Button>
            </Link>
          }
        >
          <span className="font-semibold">Locked:</span> Finish Day {currentDayNum} first
          to unlock this day’s problems. You may review the daily theory and architecture
          modules below.
        </Banner>
      )}

      {/* Reverse Accountability Trash Badge Banner */}
      <TrashBadgeBanner
        trashInfo={trashInfo}
        onInspect={() => setShowTrashModal(true)}
      />

      {/* Step-by-Step Daily Progress Shower (Stepper Checklist) */}
      <DayProgressStepper
        dayNumber={dayNumber}
        dsaTheoryRead={isDsaRead}
        csTheoryRead={isCsRead}
        systemDesignRead={isSdRead}
        solvedCount={solvedCount}
        totalProblems={dayProblems.length}
        mcqAnsweredCount={answeredMcqsCount}
        totalMcqs={mcqSet.total}
        onJumpToSection={handleJumpToSection}
      />

      {/* Segmented Filter Pills on Mobile */}
      <div className="flex sm:hidden overflow-x-auto p-1 rounded-[var(--radius-md)] bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] gap-1">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] whitespace-nowrap transition-colors',
            activeTab === 'all'
              ? 'bg-[rgb(var(--surface))] text-[rgb(var(--accent))] shadow-sm'
              : 'text-[rgb(var(--text-muted))]'
          )}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('dsa')}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] whitespace-nowrap transition-colors',
            activeTab === 'dsa'
              ? 'bg-[rgb(var(--surface))] text-[rgb(var(--accent))] shadow-sm'
              : 'text-[rgb(var(--text-muted))]'
          )}
        >
          DSA Theory
        </button>
        <button
          onClick={() => setActiveTab('cs')}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] whitespace-nowrap transition-colors',
            activeTab === 'cs'
              ? 'bg-[rgb(var(--surface))] text-blue-400 shadow-sm'
              : 'text-[rgb(var(--text-muted))]'
          )}
        >
          CS Fund
        </button>
        <button
          onClick={() => setActiveTab('system_design')}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] whitespace-nowrap transition-colors',
            activeTab === 'system_design'
              ? 'bg-[rgb(var(--surface))] text-purple-400 shadow-sm'
              : 'text-[rgb(var(--text-muted))]'
          )}
        >
          Sys Design
        </button>
        <button
          onClick={() => setActiveTab('problems')}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] whitespace-nowrap transition-colors',
            activeTab === 'problems'
              ? 'bg-[rgb(var(--surface))] text-[rgb(var(--accent))] shadow-sm'
              : 'text-[rgb(var(--text-muted))]'
          )}
        >
          Problems ({solvedCount}/5)
        </button>
        <button
          onClick={() => setActiveTab('mcq')}
          className={cn(
            'px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] whitespace-nowrap transition-colors',
            activeTab === 'mcq'
              ? 'bg-[rgb(var(--surface))] text-emerald-400 shadow-sm'
              : 'text-[rgb(var(--text-muted))]'
          )}
        >
          MCQs ({answeredMcqsCount}/{mcqSet.total})
        </button>
      </div>

      {/* Main Flow: Sequential Learning Blocks */}
      <div className="space-y-0">
        {/* Step 1: DSA Theory & Invariants */}
        <RevealOnScroll delay={0}>
          <div
            id="dsa-theory"
            className={cn(
              'scroll-mt-24',
              activeTab !== 'all' && activeTab !== 'dsa' && 'hidden sm:block'
            )}
          >
            <TheoryBlock
              dayNumber={dayNumber}
              theme={day.theme}
              summary={day.summary}
            />
          </div>
        </RevealOnScroll>

        <SectionConnector
          label="02 · CS Fundamentals"
          fromColor="text-blue-400"
          completed={isDsaRead}
        />

        {/* Step 2: CS Fundamentals Module */}
        {csModule && (
          <RevealOnScroll delay={80}>
            <div
              id="cs-fundamentals"
              className={cn(
                'scroll-mt-24',
                activeTab !== 'all' && activeTab !== 'cs' && 'hidden sm:block'
              )}
            >
              <CsFundamentalsBlock module={csModule} dayNumber={dayNumber} />
            </div>
          </RevealOnScroll>
        )}

        <SectionConnector
          label="03 · System Design"
          fromColor="text-purple-400"
          completed={isCsRead}
        />

        {/* Step 3: System Design Module */}
        {sdModule && (
          <RevealOnScroll delay={80}>
            <div
              id="system-design"
              className={cn(
                'scroll-mt-24',
                activeTab !== 'all' && activeTab !== 'system_design' && 'hidden sm:block'
              )}
            >
              <SystemDesignBlock module={sdModule} dayNumber={dayNumber} />
            </div>
          </RevealOnScroll>
        )}

        <SectionConnector
          label="04 · Practice Problems"
          fromColor="text-orange-400"
          completed={isSdRead}
        />

        {/* Step 4: Curated Practice Problems (3 LC + 2 CF) */}
        <RevealOnScroll delay={80}>
          <div
            id="problems-section"
            className={cn(
              'scroll-mt-24 space-y-4',
              activeTab !== 'all' && activeTab !== 'problems' && 'hidden sm:block'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase tracking-wide">
                    04 / Problems
                  </span>
                  <span className="text-[11px] text-[rgb(var(--text-muted))]">
                    3 LeetCode + 2 Codeforces
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[rgb(var(--text-primary))]">
                  Curated Practice Problems
                </h2>
                <p className="text-xs text-[rgb(var(--text-muted))]">
                  Solve each in your preferred IDE or browser, then tick to track.
                </p>
              </div>

              {allSolved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All 5 Problems Cleared</span>
                </span>
              )}
            </div>

            {isLocked ? (
              <div className="p-8 text-center border border-dashed border-[rgb(var(--border))] rounded-[var(--radius-md)] bg-[rgb(var(--surface)/0.5)] space-y-3">
                <Lock className="w-8 h-8 text-[rgb(var(--text-muted))] mx-auto" />
                <h3 className="font-semibold text-sm">Problems are locked</h3>
                <p className="text-xs text-[rgb(var(--text-secondary))] max-w-md mx-auto">
                  Strict streak enforcement keeps you focused on one day at a time.
                  Finish earlier days to unlock.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayProblems.map((problem, idx) => (
                  <ProblemRow
                    key={problem.id}
                    problem={problem}
                    dayNumber={dayNumber}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </div>
        </RevealOnScroll>

        <SectionConnector
          label="05 · Daily MCQ Gauntlet"
          fromColor="text-emerald-400"
          completed={allSolved}
        />

        {/* Step 5: Daily 60-Question MCQ Gauntlet */}
        <RevealOnScroll delay={80}>
          <div
            id="mcq-section"
            className={cn(
              'scroll-mt-24',
              activeTab !== 'all' && activeTab !== 'mcq' && 'hidden sm:block'
            )}
          >
            <DayMcqGauntlet
              dayNumber={dayNumber}
              dsaMcqs={mcqSet.dsa}
              csMcqs={mcqSet.cs}
              systemDesignMcqs={mcqSet.systemDesign}
            />
          </div>
        </RevealOnScroll>

        {/* Daily Notes Section */}
        <div
          id="notes-section"
          className={cn(
            'pt-8',
            activeTab !== 'all' && activeTab !== 'notes' && 'hidden sm:block'
          )}
        >
          <NotesBox
            initialValue={dayNote}
            onSave={(val) => {
              setDayNote(val);
              setNote(`day_${dayNumber}`, val);
            }}
            placeholder={`Notes for Day ${dayNumber} (${day.theme}). Save edge cases, gotchas, or interview explanations...`}
          />
        </div>
      </div>

      {/* Completion Status & Mark Complete Floating Bar */}
      <div className="sticky bottom-16 md:bottom-6 z-20 p-3 sm:p-4 rounded-[var(--radius-lg)] bg-[rgb(var(--surface)/0.92)] border border-[rgb(var(--border))] shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="space-y-1.5 w-full sm:w-auto">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                canMarkComplete ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              )}
            />
            <span className="text-xs sm:text-sm font-semibold text-[rgb(var(--text-primary))]">
              {isComplete
                ? `Day ${dayNumber} Completed! 🎉`
                : canMarkComplete
                ? `Day ${dayNumber} — Ready to lock in!`
                : `Day ${dayNumber} In Progress`}
            </span>
          </div>

          {/* Milestone status dots */}
          <div className="flex items-center gap-1.5 justify-center sm:justify-start flex-wrap">
            {[
              { label: 'DSA', done: isDsaRead, color: 'bg-indigo-400' },
              { label: 'CS', done: isCsRead, color: 'bg-blue-400' },
              { label: 'SD', done: isSdRead, color: 'bg-purple-400' },
              { label: `${solvedCount}/5`, done: allSolved, color: 'bg-orange-400' },
              { label: `${answeredMcqsCount}/15 MCQ`, done: isMcqSatisfied, color: 'bg-emerald-400' },
            ].map((m) => (
              <span
                key={m.label}
                className={cn(
                  'inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border transition-all',
                  m.done
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-[rgb(var(--surface-raised))] border-[rgb(var(--border))] text-[rgb(var(--text-muted))]'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', m.done ? 'bg-emerald-400' : m.color + '/40')} />
                {m.label}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {canMarkComplete && !isComplete ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleMarkComplete}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 font-bold cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>Mark Day Complete</span>
            </Button>
          ) : isComplete ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCelebration(true)}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-1.5" />
              <span>View Badge</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled
              className="opacity-50 cursor-not-allowed"
            >
              <span>Complete Milestones First</span>
            </Button>
          )}
        </div>
      </div>

      {/* Day Complete Celebration Modal */}
      <DayCompleteModal
        dayNumber={dayNumber}
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
      />

      {/* Reverse Accountability Trash Badge Modal */}
      <TrashBadgeModal
        trashInfo={trashInfo}
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
      />
    </div>
  );
}
