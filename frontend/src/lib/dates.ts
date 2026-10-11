export function getCurrentDayNumber(startDate: string): number {
  // Parse YYYY-MM-DD in local time
  const [year, month, day] = startDate.split('T')[0].split('-').map(Number);
  const start = new Date(year, (month || 1) - 1, day || 1);
  start.setHours(0, 0, 0, 0);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(diffDays + 1, 1), 30);
}

export function getDayStatus(
  dayNumber: number,
  currentDay: number,
  isComplete: boolean,
  strictMode: boolean
): 'done' | 'today' | 'missed' | 'locked' | 'future' {
  if (isComplete) return 'done';
  if (dayNumber === currentDay) return 'today';
  if (dayNumber < currentDay) return 'missed';
  if (strictMode && dayNumber > currentDay) return 'locked';
  return 'future';
}

export function formatRelativeDay(dayNumber: number, currentDay: number): string {
  if (dayNumber === currentDay) return 'Today';
  if (dayNumber === currentDay - 1) return 'Yesterday';
  if (dayNumber === currentDay + 1) return 'Tomorrow';
  return `Day ${dayNumber}`;
}

export function getWeekNumber(dayNumber: number): number {
  return Math.ceil(dayNumber / 7);
}

export function getDaysInWeek(weekNumber: number): number[] {
  const start = (weekNumber - 1) * 7 + 1;
  const end = Math.min(weekNumber * 7, 30);
  const days: number[] = [];
  for (let i = start; i <= end; i++) {
    days.push(i);
  }
  return days;
}
