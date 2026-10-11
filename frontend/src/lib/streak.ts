import { type DayCompletion } from './stores/progress-store';

export interface StreakInfo {
  current: number;
  longest: number;
  hasFreezeAvailable: boolean;
  freezeUsedToday: boolean;
  lastCompletedDay: number | null;
  isAtRisk: boolean;
}

export function calculateStreak(
  dayCompletions: Record<number, DayCompletion>,
  startDate: string | null
): StreakInfo {
  if (!startDate || Object.keys(dayCompletions).length === 0) {
    return {
      current: 0,
      longest: 0,
      hasFreezeAvailable: false,
      freezeUsedToday: false,
      lastCompletedDay: null,
      isAtRisk: false,
    };
  }

  const start = new Date(startDate);
  const now = new Date();
  const currentDayNumber = Math.min(
    Math.max(Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1, 1),
    30
  );

  // Build sorted list of completed day numbers
  const completedDays = Object.values(dayCompletions)
    .filter((d) => !d.isLate)
    .map((d) => d.dayNumber)
    .sort((a, b) => a - b);

  if (completedDays.length === 0) {
    return {
      current: 0,
      longest: 0,
      hasFreezeAvailable: false,
      freezeUsedToday: false,
      lastCompletedDay: null,
      isAtRisk: true,
    };
  }

  // Calculate current streak (consecutive days ending at or near currentDayNumber)
  let current = 0;
  for (let d = currentDayNumber; d >= 1; d--) {
    if (completedDays.includes(d)) {
      current++;
    } else if (d === currentDayNumber) {
      // Today not done yet, check if yesterday continues streak
      continue;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longest = 0;
  let streak = 0;
  let prev = 0;
  for (const day of completedDays) {
    if (day === prev + 1) {
      streak++;
    } else {
      streak = 1;
    }
    longest = Math.max(longest, streak);
    prev = day;
  }

  const lastCompletedDay = completedDays[completedDays.length - 1];
  
  // Freeze available after 7 straight days
  const hasFreezeAvailable = longest >= 7;
  
  // At risk if today not done and < 4 hours left
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const hoursLeft = (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60);
  const todayDone = completedDays.includes(currentDayNumber);
  const isAtRisk = !todayDone && hoursLeft < 4;

  return {
    current,
    longest,
    hasFreezeAvailable,
    freezeUsedToday: false,
    lastCompletedDay,
    isAtRisk,
  };
}

export function getTimeRemainingToday(): string {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const diffMs = endOfDay.getTime() - now.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m left today`;
  }
  return `${minutes}m left today`;
}
