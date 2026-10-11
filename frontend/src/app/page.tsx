'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Cpu,
  Layers,
  CheckCircle2,
  Calendar,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  getDayByNumber,
  getProblemsForDay,
  getCsModuleForDay,
  getSystemDesignModuleForDay,
  getMcqsForDay,
  TOTAL_DAYS,
  TOTAL_PROBLEMS,
} from '@/lib/data';
import { useProgressStore } from '@/lib/stores/progress-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { getCurrentDayNumber } from '@/lib/dates';
import { calculateStreak, getTimeRemainingToday } from '@/lib/streak';
import { greetings, getRandomEncouragement } from '@/lib/copy';
import { ProblemRow } from '@/components/day/problem-row';
import { DayStrip } from '@/components/day/day-strip';
import { TheoryBlock } from '@/components/day/theory-block';
import { CsFundamentalsBlock } from '@/components/day/cs-fundamentals-block';
import { SystemDesignBlock } from '@/components/day/system-design-block';
import { DayMcqGauntlet } from '@/components/day/day-mcq-gauntlet';
import { DayProgressStepper } from '@/components/day/day-progress-stepper';
import { DayCompleteModal } from '@/components/day/day-complete-modal';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { Card } from '@/components/ui/card';
import { SectionConnector } from '@/components/ui/section-connector';
import { RevealOnScroll } from '@/components/ui/reveal-on-scroll';
import { calculateTrashBadge } from '@/lib/accountability';
import { TrashBadgeBanner } from '@/components/accountability/trash-badge-banner';
import { TrashBadgeModal } from '@/components/accountability/trash-badge-modal';
import { TrashBadgePill } from '@/components/accountability/trash-badge-pill';
import { cn } from '@/lib/utils';

export default function TodayPage() {
  const {
    problems,
    dayCompletions,
    theoryRead,
    csTheoryRead,
    systemDesignRead,
    mcqAnswers,
    startDate,
    setStartDate,
    completeDay,
  } = useProgressStore();

  const { strictMode } = useSettingsStore();

  const [showCelebration, setShowCelebration] = React.useState(false);
  const [showTrashModal, setShowTrashModal] = React.useState(false);
  const [timeRemaining, setTimeRemaining] = React.useState('4h remaining');
  const [encouragement, setEncouragement] = React.useState('Consistency beats intensity.');

  const trashInfo = React.useMemo(
    () => calculateTrashBadge(dayCompletions, startDate),
    [dayCompletions, startDate]
  );

  React.useEffect(() => {
    setEncouragement(getRandomEncouragement());
    setTimeRemaining(getTimeRemainingToday());

    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemainingToday());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Determine current active day
  const currentDayNum = React.useMemo(() => {
    if (!startDate) return 1;
    return getCurrentDayNumber(startDate);
  }, [startDate]);

  const currentDayData = getDayByNumber(currentDayNum) || getDayByNumber(1)!;
  const currentProblems = getProblemsForDay(currentDayNum);
  const csModule = getCsModuleForDay(currentDayNum);
  const sdModule = getSystemDesignModuleForDay(currentDayNum);
  const mcqSet = getMcqsForDay(currentDayNum);

  const solvedCountToday = currentProblems.filter(
    (p) => problems[p.id]?.status === 'solved'
  ).length;

  const isTodayCompleted = !!dayCompletions[currentDayNum];
  const allSolvedToday = solvedCountToday === 5;
  const problemsComplete = allSolvedToday;

  const isDsaRead = !!theoryRead[currentDayNum];
  const isCsRead = !!csTheoryRead[currentDayNum];
  const isSdRead = !!systemDesignRead[currentDayNum];

  // Count answered MCQs for today
  const answeredMcqsCount = React.useMemo(() => {
    let count = 0;
    const allTodayMcqs = [...mcqSet.dsa, ...mcqSet.cs, ...mcqSet.systemDesign];
    allTodayMcqs.forEach((q) => {
      if (mcqAnswers[q.id]) count++;
    });
    return count;
  }, [mcqSet, mcqAnswers]);

  const isMcqSatisfied = answeredMcqsCount >= Math.min(15, mcqSet.total);
  const canMarkDayComplete =
    allSolvedToday && isDsaRead && isCsRead && isSdRead && isMcqSatisfied;

  // Streak calculation
  const streak = calculateStreak(dayCompletions, startDate);

  // Overall solved problems count
  const totalSolvedCount = Object.values(problems).filter(
    (p) => p.status === 'solved'
  ).length;

  const totalDaysCompleted = Object.keys(dayCompletions).length;

  // Greeting copy
  const greetingText = React.useMemo(() => {
    if (!startDate) return greetings.newUser;
    if (isTodayCompleted) return greetings.doneToday(currentDayNum);
    if (totalDaysCompleted < currentDayNum - 1) return greetings.behind(currentDayNum);
    return greetings.active(currentDayNum);
  }, [startDate, isTodayCompleted, currentDayNum, totalDaysCompleted]);

  const handleStartJourney = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setStartDate(todayStr);
  };

  const handleMarkDayComplete = () => {
    completeDay(currentDayNum);
    setShowCelebration(true);
  };

  const handleJumpToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-[860px] w-full mx-auto py-6 sm:py-8 space-y-8">
      {/* 1. Header Greeting & Status */}
      <section className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[rgb(var(--text-primary))]">
              {greetingText}
            </h1>
            <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] mt-0.5">
              {totalDaysCompleted} of {TOTAL_DAYS} days completed • {totalSolvedCount} of {TOTAL_PROBLEMS} solved
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Trash Badge Indicator (if slacking) */}
            <TrashBadgePill
              trashInfo={trashInfo}
              onClick={() => setShowTrashModal(true)}
            />

            {/* Soft countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgb(var(--surface-raised))] border border-[rgb(var(--border))] text-xs text-[rgb(var(--text-secondary))] font-mono">
              <Clock className="w-3.5 h-3.5 text-[rgb(var(--text-muted))]" />
              <span>{timeRemaining}</span>
            </div>

            {/* Streak Badge */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[rgb(var(--warning)/0.1)] border border-[rgb(var(--warning)/0.25)] text-xs font-semibold text-[rgb(var(--warning))] font-mono">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{streak.current}d streak</span>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <ProgressBar value={totalSolvedCount} max={TOTAL_PROBLEMS} size="sm" variant="accent" />
      </section>

      {/* Reverse Accountability Trash Badge Warning Banner */}
      <TrashBadgeBanner
        trashInfo={trashInfo}
        onInspect={() => setShowTrashModal(true)}
      />

      {/* Guest Mode banner if not started */}
      {!startDate && (
        <Banner
          variant="info"
          action={
            <Button size="sm" onClick={handleStartJourney}>
              Begin Day 1
            </Button>
          }
        >
          Ready to commit? Start your 30-day streak now. Your progress is saved automatically on this device.
        </Banner>
      )}

      {/* 2. Today Focus Card */}
      <Card className="p-5 sm:p-7 relative overflow-hidden border-[rgb(var(--accent)/0.3)] bg-gradient-to-br from-[rgb(var(--surface))] to-[rgb(var(--surface-raised))]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))]">
                TODAY • DAY {currentDayNum}
              </span>
              <span className="text-xs text-[rgb(var(--text-muted))]">•</span>
              <span className="text-xs text-[rgb(var(--text-muted))] flex items-center gap-1">
                <Clock className="w-3 h-3" /> ~60-75 min
              </span>
              <span className="text-xs text-[rgb(var(--text-muted))]">•</span>
              <span className="text-xs text-blue-400 font-mono">
                CS: {csModule?.title.split(':')[0]}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))]">
              {currentDayData.theme}
            </h2>
            <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] leading-relaxed max-w-2xl">
              {currentDayData.summary}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <a href="#dsa-theory">
                <Button size="sm" variant="secondary">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>DSA Theory</span>
                </Button>
              </a>
              <a href="#cs-fundamentals">
                <Button size="sm" variant="secondary">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  <span>CS Fundamentals</span>
                </Button>
              </a>
              <a href="#system-design">
                <Button size="sm" variant="secondary">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>System Design</span>
                </Button>
              </a>
              <a href="#problems-section">
                <Button size="sm" variant="primary">
                  <span>5 Problems</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </a>
              <a href="#mcq-section">
                <Button size="sm" variant="secondary">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>60 MCQs</span>
                </Button>
              </a>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center justify-center gap-3 p-4 bg-[rgb(var(--surface))] rounded-[var(--radius-md)] border border-[rgb(var(--border))] shrink-0 self-center">
            <ProgressRing
              value={solvedCountToday}
              max={5}
              size={76}
              strokeWidth={7}
            />
            <div className="text-center">
              <span className="text-xs font-semibold text-[rgb(var(--text-primary))]">
                {isTodayCompleted
                  ? 'Completed!'
                  : `${5 - solvedCountToday} left today`}
              </span>
              <p className="text-[11px] text-[rgb(var(--text-muted))]">
                {solvedCountToday}/5 solved
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Step-by-Step Daily Progress Shower (Stepper Checklist) */}
      <DayProgressStepper
        dayNumber={currentDayNum}
        dsaTheoryRead={isDsaRead}
        csTheoryRead={isCsRead}
        systemDesignRead={isSdRead}
        solvedCount={solvedCountToday}
        totalProblems={5}
        mcqAnsweredCount={answeredMcqsCount}
        totalMcqs={mcqSet.total}
        onJumpToSection={handleJumpToSection}
      />

      {/* 4. Sequential Learning Flow */}
      <div className="space-y-0">
        {/* Step 1: DSA Core Theory */}
        <RevealOnScroll delay={0}>
          <div id="dsa-theory" className="scroll-mt-24">
            <TheoryBlock
              dayNumber={currentDayNum}
              theme={currentDayData.theme}
              summary={currentDayData.summary}
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
            <div id="cs-fundamentals" className="scroll-mt-24">
              <CsFundamentalsBlock module={csModule} dayNumber={currentDayNum} />
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
            <div id="system-design" className="scroll-mt-24">
              <SystemDesignBlock module={sdModule} dayNumber={currentDayNum} />
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
          <section id="problems-section" className="scroll-mt-24 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase tracking-wide">
                    04 / Problems
                  </span>
                  <span className="text-[11px] text-[rgb(var(--text-muted))]">
                    3 LeetCode classics + 2 Codeforces puzzles
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[rgb(var(--text-primary))]">
                  Today&apos;s Practice Set (5 Problems)
                </h3>
                <p className="text-xs text-[rgb(var(--text-muted))]">
                  Solve each problem in your IDE, then mark as solved.
                </p>
              </div>

              {allSolvedToday && !isTodayCompleted && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>5/5 Problems Cleared</span>
                </span>
              )}
            </div>

            <div className="space-y-3">
              {currentProblems.map((prob, idx) => (
                <ProblemRow
                  key={prob.id}
                  problem={prob}
                  dayNumber={currentDayNum}
                  index={idx}
                />
              ))}
            </div>
          </section>
        </RevealOnScroll>

        <SectionConnector
          label="05 · Daily MCQ Gauntlet"
          fromColor="text-emerald-400"
          completed={problemsComplete}
        />

        {/* Step 5: Daily 60-Question MCQ Gauntlet */}
        <RevealOnScroll delay={80}>
          <div id="mcq-section" className="scroll-mt-24">
            <DayMcqGauntlet
              dayNumber={currentDayNum}
              dsaMcqs={mcqSet.dsa}
              csMcqs={mcqSet.cs}
              systemDesignMcqs={mcqSet.systemDesign}
            />
          </div>
        </RevealOnScroll>
      </div>

      {/* Floating Day Completion Bar */}
      <div className="sticky bottom-6 z-20 p-3 sm:p-4 rounded-[var(--radius-lg)] bg-[rgb(var(--surface)/0.92)] border border-[rgb(var(--border))] shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="space-y-1.5 w-full sm:w-auto">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                canMarkDayComplete ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              )}
            />
            <span className="text-xs sm:text-sm font-semibold text-[rgb(var(--text-primary))]">
              {isTodayCompleted
                ? `Day ${currentDayNum} Complete! 🎉`
                : canMarkDayComplete
                ? `Day ${currentDayNum} — Ready to lock in!`
                : `Day ${currentDayNum} In Progress`}
            </span>
          </div>

          {/* Milestone status dots */}
          <div className="flex items-center gap-1.5 justify-center sm:justify-start flex-wrap">
            {[
              { label: 'DSA', done: isDsaRead, color: 'bg-indigo-400' },
              { label: 'CS', done: isCsRead, color: 'bg-blue-400' },
              { label: 'SD', done: isSdRead, color: 'bg-purple-400' },
              { label: `${solvedCountToday}/5`, done: allSolvedToday, color: 'bg-orange-400' },
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

        <div className="shrink-0">
          {canMarkDayComplete && !isTodayCompleted ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleMarkDayComplete}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 font-bold cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>Mark Day Complete</span>
            </Button>
          ) : isTodayCompleted ? (
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

      {/* 5. 30-Day Strip */}
      <section className="p-4 rounded-[var(--radius-md)] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
        <DayStrip currentDay={currentDayNum} />
      </section>

      {/* 6. Rotating Encouragement Footer Message */}
      <div className="text-center py-4">
        <p className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] italic flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[rgb(var(--accent))]" />
          &ldquo;{encouragement}&rdquo;
        </p>
      </div>

      {/* Day Complete Modal */}
      <DayCompleteModal
        dayNumber={currentDayNum}
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
