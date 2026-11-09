import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { CurriculumService } from "../src/services/curriculum.service.js";

describe("Component 3: 30-Day Curriculum & Day Mapping Service", () => {
  let mockDb: MockFirestore;
  let curriculumService: CurriculumService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    curriculumService = new CurriculumService(mockDb as any);
  });

  it("should create a day with exactly 5 problems", async () => {
    const day = await curriculumService.createDay({
      id: "day_1",
      number: 1,
      theme: "Arrays & Hashing",
      summary: "Foundation of algorithmic efficiency using direct indexing and hash lookups.",
      theoryContent: "# Day 1: Arrays & Hashing\nLearn HashMap vs HashSet in O(1)...",
      strictOrder: 1,
      problemIds: ["lc_1", "lc_217", "lc_49", "cf_1850A", "cf_158B"],
    });

    expect(day.id).toBe("day_1");
    expect(day.number).toBe(1);
    expect(day.problemIds).toHaveLength(5);
  });

  it("should reject a day that does not have exactly 5 problems", async () => {
    await expect(
      curriculumService.createDay({
        id: "day_2",
        number: 2,
        theme: "Two Pointers",
        summary: "Incomplete day",
        theoryContent: "Content",
        strictOrder: 2,
        problemIds: ["lc_11", "lc_15"], // Only 2 problems!
      })
    ).rejects.toThrow(/Each day must have exactly 5 problems/);
  });

  it("should evaluate day accessibility under free mode (strictMode = false)", () => {
    // In free mode, all days are unlocked regardless of previous completion
    const statusDay1 = curriculumService.evaluateDayStatus(1, new Set(), 0, 5, false);
    expect(statusDay1).toBe("unlocked");

    const statusDay5 = curriculumService.evaluateDayStatus(5, new Set(), 0, 5, false);
    expect(statusDay5).toBe("unlocked");

    // If some problems solved, it's in_progress
    const statusDay3InProgress = curriculumService.evaluateDayStatus(3, new Set(), 2, 5, false);
    expect(statusDay3InProgress).toBe("in_progress");

    // If 5 problems solved, it's completed
    const statusDay2Complete = curriculumService.evaluateDayStatus(2, new Set(), 5, 5, false);
    expect(statusDay2Complete).toBe("completed");
  });

  it("should enforce gating under strict mode (strictMode = true)", () => {
    // Day 1 is always unlocked
    const statusDay1 = curriculumService.evaluateDayStatus(1, new Set(), 0, 5, true);
    expect(statusDay1).toBe("unlocked");

    // Day 2 is locked if Day 1 is not in completedDayNumbers
    const statusDay2Locked = curriculumService.evaluateDayStatus(2, new Set(), 0, 5, true);
    expect(statusDay2Locked).toBe("locked");

    // Day 2 unlocks once Day 1 is marked complete
    const statusDay2Unlocked = curriculumService.evaluateDayStatus(2, new Set([1]), 0, 5, true);
    expect(statusDay2Unlocked).toBe("unlocked");

    // Day 3 remains locked until Day 2 is also completed
    const statusDay3Locked = curriculumService.evaluateDayStatus(3, new Set([1]), 0, 5, true);
    expect(statusDay3Locked).toBe("locked");
  });

  it("should locate the first incomplete day for 'Continue where you left off'", () => {
    const completed = new Set([1, 2]);
    const nextDay = curriculumService.findFirstIncompleteDay(completed);
    expect(nextDay).toBe(3);

    const emptyCompleted = new Set<number>();
    expect(curriculumService.findFirstIncompleteDay(emptyCompleted)).toBe(1);
  });
});

