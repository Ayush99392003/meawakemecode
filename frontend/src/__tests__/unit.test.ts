import { describe, it, expect } from 'vitest';
import { calculateStreak } from '../lib/streak';
import { getCurrentDayNumber, getDayStatus, getWeekNumber } from '../lib/dates';
import { days, problems, getDayByNumber, getProblemsForDay } from '../lib/data';

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('30-Day Curriculum Integrity', () => {
  it('loads all 30 days correctly', () => {
    expect(days.length).toBe(30);
    expect(days[0].number).toBe(1);
    expect(days[29].number).toBe(30);
  });

  it('each day has exactly 5 problems', () => {
    for (const d of days) {
      expect(d.problemIds.length).toBe(5);
      const dayProblems = getProblemsForDay(d.number);
      expect(dayProblems.length).toBe(5);
    }
  });

  it('contains at least 150 unique problems across LC and CF', () => {
    expect(problems.length).toBeGreaterThanOrEqual(150);
  });
});

describe('Dates and Day Status Logic', () => {
  it('calculates current day correctly from start date', () => {
    const today = getTodayString();
    expect(getCurrentDayNumber(today)).toBe(1);
  });

  it('identifies status for done, today, missed, locked', () => {
    expect(getDayStatus(1, 1, false, true)).toBe('today');
    expect(getDayStatus(1, 2, true, true)).toBe('done');
    expect(getDayStatus(1, 2, false, true)).toBe('missed');
    expect(getDayStatus(3, 1, false, true)).toBe('locked');
    expect(getDayStatus(3, 1, false, false)).toBe('future');
  });

  it('computes week number correctly', () => {
    expect(getWeekNumber(1)).toBe(1);
    expect(getWeekNumber(7)).toBe(1);
    expect(getWeekNumber(8)).toBe(2);
    expect(getWeekNumber(15)).toBe(3);
    expect(getWeekNumber(22)).toBe(4);
  });
});

describe('Streak Calculation', () => {
  it('returns zero streak when no days completed', () => {
    const result = calculateStreak({}, '2026-11-01');
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
    expect(result.hasFreezeAvailable).toBe(false);
  });

  it('calculates consecutive day completions as current streak', () => {
    const today = getTodayString();
    const completions = {
      1: { dayNumber: 1, completedAt: today, isLate: false },
    };
    const result = calculateStreak(completions, today);
    expect(result.current).toBe(1);
  });
});
