import { describe, it, expect } from "vitest";
import { StreakService } from "../src/services/streak.service.js";
import { ProblemInputSchema } from "../src/schemas/problem.schema.js";

describe("Edge Case Suite: Streaks, Timezones & Format Boundaries", () => {
  it("should calculate unbroken streak across a leap year (Feb 28 -> Feb 29 -> March 1)", () => {
    const leapYearTimestamps = [
      "2028-02-28T12:00:00Z",
      "2028-02-29T12:00:00Z",
      "2028-03-01T12:00:00Z",
    ];
    const refDate = new Date("2028-03-01T15:00:00Z");

    const result = StreakService.calculateStreaks(leapYearTimestamps, "UTC", refDate);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.totalDaysActive).toBe(3);
  });

  it("should calculate unbroken streak across a new year boundary (Dec 31 -> Jan 1)", () => {
    const yearBoundaryTimestamps = [
      "2025-12-31T23:00:00Z",
      "2026-01-01T01:00:00Z",
    ];
    const refDate = new Date("2026-01-01T12:00:00Z");

    const result = StreakService.calculateStreaks(yearBoundaryTimestamps, "UTC", refDate);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it("should recognize two distinct streak days when problems are solved at 23:59:50 and 00:00:10", () => {
    // In Asia/Kolkata (UTC+5:30)
    const timestamps = [
      "2026-11-04T18:29:50Z", // 23:59:50 IST on Nov 4
      "2026-11-04T18:30:10Z", // 00:00:10 IST on Nov 5
    ];
    const refDate = new Date("2026-11-04T19:00:00Z"); // Morning of Nov 5 in IST

    const result = StreakService.calculateStreaks(timestamps, "Asia/Kolkata", refDate);
    expect(result.currentStreak).toBe(2);
    expect(result.totalDaysActive).toBe(2);
  });

  it("should not inflate streak count if user solves 10 problems on the same day", () => {
    const sameDayTimestamps = [
      "2026-11-05T01:00:00Z",
      "2026-11-05T03:00:00Z",
      "2026-11-05T07:00:00Z",
      "2026-11-05T12:00:00Z",
      "2026-11-05T18:00:00Z",
    ];
    const refDate = new Date("2026-11-05T20:00:00Z");

    const result = StreakService.calculateStreaks(sameDayTimestamps, "UTC", refDate);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.totalDaysActive).toBe(1);
  });

  it("should handle empty or dirty timestamps array without crashing", () => {
    const emptyResult = StreakService.calculateStreaks([], "UTC");
    expect(emptyResult.currentStreak).toBe(0);
    expect(emptyResult.longestStreak).toBe(0);

    const dirtyTimestamps = ["", "invalid-date", "2026-11-05T12:00:00Z"];
    const dirtyResult = StreakService.calculateStreaks(
      dirtyTimestamps.filter((t) => t && !isNaN(new Date(t).getTime())),
      "UTC",
      new Date("2026-11-05T15:00:00Z")
    );
    expect(dirtyResult.currentStreak).toBe(1);
    expect(dirtyResult.totalDaysActive).toBe(1);
  });

  it("should reject Codeforces problem input with malicious or invalid external IDs", () => {
    const invalidCFs = ["CF1850", "1850", "1850-A", "SELECT * FROM problems", "<script>"];
    for (const badId of invalidCFs) {
      expect(() =>
        ProblemInputSchema.parse({
          id: `cf_${badId}`,
          platform: "CF",
          externalId: badId,
          title: "Malicious Problem",
          url: "https://codeforces.com/problemset/problem/1/A",
          difficulty: "1000",
        })
      ).toThrow();
    }
  });

  it("should accept valid complex Codeforces external IDs with sub-indices", () => {
    const validCFs = ["1850A", "71A", "158B", "1850A1", "1850B2"];
    for (const validId of validCFs) {
      const parsed = ProblemInputSchema.parse({
        id: `cf_${validId}`,
        platform: "CF",
        externalId: validId,
        title: "Valid Problem",
        url: `https://codeforces.com/problemset/problem/1850/${validId}`,
        difficulty: "1000",
      });
      expect(parsed.externalId).toBe(validId);
    }
  });
});

