export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  lastActiveLocalDate: string | null;
}

export class StreakService {
  /**
   * Converts an ISO timestamp string or Date object into a 'YYYY-MM-DD' date string
   * evaluated in the user's specific IANA timezone.
   */
  static getLocalDateString(dateInput: string | Date, timezone: string = "UTC"): string {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return formatter.format(date); // outputs "YYYY-MM-DD"
    } catch {
      // Fallback to UTC if invalid timezone provided
      return date.toISOString().split("T")[0];
    }
  }

  /**
   * Calculates current and longest streaks from an array of solved timestamps in user's timezone.
   */
  static calculateStreaks(
    solvedTimestamps: string[],
    timezone: string = "UTC",
    referenceDate: Date = new Date()
  ): StreakResult {
    if (!solvedTimestamps || solvedTimestamps.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysActive: 0,
        lastActiveLocalDate: null,
      };
    }

    // Convert each timestamp to unique local YYYY-MM-DD dates and sort ascending
    const uniqueDates = Array.from(
      new Set(solvedTimestamps.map((ts) => this.getLocalDateString(ts, timezone)))
    ).sort();

    if (uniqueDates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysActive: 0,
        lastActiveLocalDate: null,
      };
    }

    const todayLocal = this.getLocalDateString(referenceDate, timezone);
    const yesterdayDate = new Date(referenceDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayLocal = this.getLocalDateString(yesterdayDate, timezone);

    // Calculate longest consecutive streak
    let longestStreak = 1;
    let currentSequence = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1] + "T00:00:00Z");
      const curr = new Date(uniqueDates[i] + "T00:00:00Z");
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentSequence++;
        if (currentSequence > longestStreak) {
          longestStreak = currentSequence;
        }
      } else {
        currentSequence = 1;
      }
    }

    // Calculate current active streak ending today or yesterday
    const lastActiveDate = uniqueDates[uniqueDates.length - 1];
    let currentStreak = 0;

    const isLastActiveToday = lastActiveDate === todayLocal;
    const isLastActiveYesterday = lastActiveDate === yesterdayLocal;

    if (isLastActiveToday || isLastActiveYesterday) {
      currentStreak = 1;
      let targetDate = new Date(lastActiveDate + "T00:00:00Z");

      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        const expectedPrev = new Date(targetDate);
        expectedPrev.setDate(expectedPrev.getDate() - 1);
        const expectedPrevStr = expectedPrev.toISOString().split("T")[0];

        if (uniqueDates[i] === expectedPrevStr) {
          currentStreak++;
          targetDate = expectedPrev;
        } else {
          break;
        }
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalDaysActive: uniqueDates.length,
      lastActiveLocalDate: lastActiveDate,
    };
  }
}

