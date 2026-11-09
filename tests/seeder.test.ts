import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { seedBaselineData } from "../scripts/seed-curriculum.js";
import { ProblemService } from "../src/services/problem.service.js";
import { CurriculumService } from "../src/services/curriculum.service.js";
import { MCQService } from "../src/services/mcq.service.js";
import { LibraryService } from "../src/services/library.service.js";

describe("Database Seeder Pipeline", () => {
  let mockDb: MockFirestore;

  beforeEach(() => {
    mockDb = new MockFirestore();
  });

  it("should seed baseline problems, days, MCQs, and library articles without errors", async () => {
    await seedBaselineData(mockDb as any);

    const problemService = new ProblemService(mockDb as any);
    const curriculumService = new CurriculumService(mockDb as any);
    const mcqService = new MCQService(mockDb as any);
    const libraryService = new LibraryService(mockDb as any);

    // Verify problems
    const problems = await problemService.listProblems();
    expect(problems.length).toBeGreaterThanOrEqual(5);

    // Verify Day 1
    const day1 = await curriculumService.getDayByNumber(1);
    expect(day1).not.toBeNull();
    expect(day1?.problemIds).toHaveLength(5);

    // Verify MCQs
    const publicQuestions = await mcqService.getQuestionsForDayPublic("day_1");
    expect(publicQuestions.length).toBeGreaterThanOrEqual(2);
    expect((publicQuestions[0] as any).correctOption).toBeUndefined(); // Safety check

    // Verify Library
    const osPage = await libraryService.getPageBySlug("os/deadlocks");
    expect(osPage).not.toBeNull();
    expect(osPage?.section).toBe("os");
  });
});

