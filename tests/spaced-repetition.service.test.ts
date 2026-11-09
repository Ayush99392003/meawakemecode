import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { SpacedRepetitionService } from "../src/services/spaced-repetition.service.js";

describe("SM-2 Spaced Repetition Service", () => {
  let mockDb: MockFirestore;
  let sm2Service: SpacedRepetitionService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    sm2Service = new SpacedRepetitionService(mockDb as any);
  });

  it("should calculate correct SM-2 progression for successful reviews (q >= 3)", () => {
    // Review 1 (q = 4): interval = 1 day, repetition = 1
    const r1 = SpacedRepetitionService.calculateSM2(4, 0, 0, 2.5);
    expect(r1.repetition).toBe(1);
    expect(r1.intervalDays).toBe(1);
    expect(r1.easeFactor).toBeGreaterThanOrEqual(2.5);

    // Review 2 (q = 4): interval = 6 days, repetition = 2
    const r2 = SpacedRepetitionService.calculateSM2(4, r1.repetition, r1.intervalDays, r1.easeFactor);
    expect(r2.repetition).toBe(2);
    expect(r2.intervalDays).toBe(6);

    // Review 3 (q = 5): interval = round(6 * EF) >= 15 days, repetition = 3
    const r3 = SpacedRepetitionService.calculateSM2(5, r2.repetition, r2.intervalDays, r2.easeFactor);
    expect(r3.repetition).toBe(3);
    expect(r3.intervalDays).toBeGreaterThan(6);
  });

  it("should reset repetition count to 0 and interval to 1 day on failed recall (q < 3)", () => {
    // Current state has high repetition and interval
    const currentRep = 4;
    const currentInterval = 30;
    const currentEF = 2.4;

    // User blanks out on concept (q = 1)
    const failedRecall = SpacedRepetitionService.calculateSM2(1, currentRep, currentInterval, currentEF);
    expect(failedRecall.repetition).toBe(0);
    expect(failedRecall.intervalDays).toBe(1);
    expect(failedRecall.easeFactor).toBeLessThan(currentEF);
  });

  it("should clamp minimum ease factor to 1.3 even after multiple consecutive failures", () => {
    let ef = 2.5;
    for (let i = 0; i < 10; i++) {
      const res = SpacedRepetitionService.calculateSM2(0, 0, 1, ef);
      ef = res.easeFactor;
    }
    expect(ef).toBe(1.3);
  });

  it("should store and retrieve due reviews accurately", async () => {
    const userId = "user_sm2_test";
    const baseDate = new Date("2026-11-05T12:00:00Z");

    // Item 1: Review today with q=4 -> nextReviewDate is tomorrow (2026-11-06)
    await sm2Service.recordReview(userId, "problem", "lc_1", 4, baseDate);

    // Item 2: Review failed with q=1 -> nextReviewDate is tomorrow (2026-11-06)
    await sm2Service.recordReview(userId, "mcq", "mcq_day1_1", 1, baseDate);

    // Check due items on 2026-11-05 (none should be due yet)
    const dueToday = await sm2Service.getDueReviews(userId, baseDate);
    expect(dueToday).toHaveLength(0);

    // Check due items tomorrow (2026-11-06) -> both should be due
    const tomorrow = new Date("2026-11-06T12:00:00Z");
    const dueTomorrow = await sm2Service.getDueReviews(userId, tomorrow);
    expect(dueTomorrow).toHaveLength(2);
    expect(dueTomorrow[0].userId).toBe(userId);
  });
});

