import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { ProgressService } from "../src/services/progress.service.js";
import { StreakService } from "../src/services/streak.service.js";

describe("Component 5: Progress Tracking & Timezone-Aware Streak Engine", () => {
  let mockDb: MockFirestore;
  let progressService: ProgressService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    progressService = new ProgressService(mockDb as any);
  });

  it("should record problem progress as solved with timestamp", async () => {
    const res = await progressService.updateProblemProgress({
      userId: "user_prog_1",
      problemId: "lc_1",
      status: "solved",
      personalTimeSeconds: 420,
      personalNote: "Solved using two-pass hash map first, then optimized to single pass.",
    });

    expect(res.progress.status).toBe("solved");
    expect(res.progress.solvedAt).toBeDefined();
    expect(res.progress.personalTimeSeconds).toBe(420);
    expect(res.dayJustCompleted).toBe(false);
  });

  it("should auto-complete day when all 5 problems are solved", async () => {
    const dayProblemIds = ["lc_1", "lc_217", "lc_49", "cf_1850A", "cf_158B"];

    // Solve problems 1 to 4
    for (let i = 0; i < 4; i++) {
      const res = await progressService.updateProblemProgress(
        {
          userId: "user_prog_2",
          problemId: dayProblemIds[i],
          status: "solved",
        },
        { dayId: "day_1", dayProblemIds }
      );
      expect(res.dayJustCompleted).toBe(false);
    }

    // Solve 5th problem
    const finalRes = await progressService.updateProblemProgress(
      {
        userId: "user_prog_2",
        problemId: dayProblemIds[4],
        status: "solved",
      },
      { dayId: "day_1", dayProblemIds }
    );

    expect(finalRes.dayJustCompleted).toBe(true);

    const summary = await progressService.getDayProgressSummary(
      "user_prog_2",
      "day_1",
      dayProblemIds
    );
    expect(summary.solvedCount).toBe(5);
    expect(summary.isDayCompleted).toBe(true);
  });

  it("should accurately calculate streaks across user timezone", () => {
    const userTz = "Asia/Kolkata"; // UTC+5:30
    const refDate = new Date("2026-11-05T20:00:00Z"); // In IST: 2026-11-06 01:30 AM

    // Problem solved on Nov 4, Nov 5, and Nov 6 (IST local dates)
    const timestamps = [
      "2026-11-04T12:00:00Z", // Nov 4 in IST
      "2026-11-05T12:00:00Z", // Nov 5 in IST
      "2026-11-05T21:00:00Z", // Nov 6 in IST (02:30 AM)
    ];

    const streak = StreakService.calculateStreaks(timestamps, userTz, refDate);
    expect(streak.currentStreak).toBe(3);
    expect(streak.longestStreak).toBe(3);
    expect(streak.totalDaysActive).toBe(3);
  });

  it("should reset current streak if a calendar day was missed", () => {
    const refDate = new Date("2026-11-05T12:00:00Z");

    // Solved on Nov 1, Nov 2, skipped Nov 3 and Nov 4, solved on Nov 5
    const timestamps = [
      "2026-11-01T12:00:00Z",
      "2026-11-02T12:00:00Z",
      "2026-11-05T10:00:00Z",
    ];

    const streak = StreakService.calculateStreaks(timestamps, "UTC", refDate);
    expect(streak.currentStreak).toBe(1); // Only today's solve
    expect(streak.longestStreak).toBe(2); // Historical max was 2
    expect(streak.totalDaysActive).toBe(3);
  });

  it("should reset user progress cleanly with confirmation", async () => {
    await progressService.updateProblemProgress({
      userId: "user_reset_test",
      problemId: "lc_1",
      status: "solved",
    });

    const resetResult = await progressService.resetUserProgress("user_reset_test");
    expect(resetResult.deletedProblems).toBe(1);

    const summary = await progressService.getDayProgressSummary("user_reset_test", "day_1", ["lc_1"]);
    expect(summary.solvedCount).toBe(0);
    expect(summary.problems[0].status).toBe("not_started");
  });
});

