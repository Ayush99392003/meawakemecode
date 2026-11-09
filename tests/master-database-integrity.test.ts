import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { seedMasterDatabase } from "../scripts/seed-master-database.js";
import { ProblemService } from "../src/services/problem.service.js";
import { CurriculumService } from "../src/services/curriculum.service.js";
import { MCQService } from "../src/services/mcq.service.js";
import { LibraryService } from "../src/services/library.service.js";
import { BookmarkService } from "../src/services/bookmark.service.js";
import { CF_EXTERNAL_ID_REGEX } from "../src/schemas/problem.schema.js";

describe("30-Day Master Database Integrity & Bookmarking Suite", () => {
  let mockDb: MockFirestore;
  let problemService: ProblemService;
  let curriculumService: CurriculumService;
  let mcqService: MCQService;
  let libraryService: LibraryService;
  let bookmarkService: BookmarkService;

  beforeEach(async () => {
    mockDb = new MockFirestore();
    await seedMasterDatabase(mockDb as any);

    problemService = new ProblemService(mockDb as any);
    curriculumService = new CurriculumService(mockDb as any);
    mcqService = new MCQService(mockDb as any);
    libraryService = new LibraryService(mockDb as any);
    bookmarkService = new BookmarkService(mockDb as any);
  });

  it("should have exactly 30 days in the curriculum sequentially numbered 1 to 30", async () => {
    const days = await curriculumService.getAllDays();
    expect(days).toHaveLength(30);

    for (let i = 0; i < 30; i++) {
      expect(days[i].number).toBe(i + 1);
      expect(days[i].theme).toBeDefined();
      expect(days[i].problemIds).toHaveLength(5);
    }
  });

  it("should verify that every single problem ID referenced across all 30 days exists in the catalog", async () => {
    const days = await curriculumService.getAllDays();
    const allProblems = await problemService.listProblems();
    const problemMap = new Map(allProblems.map((p) => [p.id, p]));

    expect(allProblems.length).toBeGreaterThanOrEqual(140);

    for (const day of days) {
      expect(day.problemIds).toHaveLength(5);
      let lcCount = 0;
      let cfCount = 0;

      for (const pid of day.problemIds) {
        const problem = problemMap.get(pid);
        expect(problem, `Problem ID ${pid} referenced in Day ${day.number} must exist`).toBeDefined();

        if (problem?.platform === "LC") lcCount++;
        if (problem?.platform === "CF") {
          cfCount++;
          expect(CF_EXTERNAL_ID_REGEX.test(problem.externalId)).toBe(true);
        }

        expect(problem?.hint).toBeDefined();
        expect(problem?.expectedTimeComplexity).toBeDefined();
        expect(problem?.expectedPattern).toBeDefined();
      }

      // Check the 3 LC + 2 CF invariant
      expect(lcCount, `Day ${day.number} must have 3 LC problems`).toBe(3);
      expect(cfCount, `Day ${day.number} must have 2 CF problems`).toBe(2);
    }
  });

  it("should bookmark problems, days, and library pages across the entire 30-day catalog", async () => {
    const userId = "master_user_bm";

    // Bookmark Day 1, Problem lc_1, and Library page os/deadlocks
    const bmDay = await bookmarkService.toggleBookmark({
      userId,
      itemType: "day",
      itemId: "day_1",
      label: "Start here",
    });
    expect(bmDay.bookmarked).toBe(true);

    const bmProb = await bookmarkService.toggleBookmark({
      userId,
      itemType: "problem",
      itemId: "lc_1",
      label: "Two Sum Revision",
    });
    expect(bmProb.bookmarked).toBe(true);

    const bmLib = await bookmarkService.toggleBookmark({
      userId,
      itemType: "library_page",
      itemId: "os/deadlocks",
      label: "Coffman conditions",
    });
    expect(bmLib.bookmarked).toBe(true);

    const allBookmarks = await bookmarkService.listBookmarks(userId);
    expect(allBookmarks).toHaveLength(3);

    const problemsOnly = await bookmarkService.listBookmarks(userId, "problem");
    expect(problemsOnly).toHaveLength(1);
    expect(problemsOnly[0].itemId).toBe("lc_1");

    const daysOnly = await bookmarkService.listBookmarks(userId, "day");
    expect(daysOnly).toHaveLength(1);
    expect(daysOnly[0].itemId).toBe("day_1");
  });

  it("should have library pages with interview Q&As that are fully searchable", async () => {
    const osPage = await libraryService.getPageBySlug("os/processes-vs-threads");
    expect(osPage).not.toBeNull();
    expect(osPage?.interviewQuestions.length).toBeGreaterThanOrEqual(1);

    const searchRes = await libraryService.search("Token Bucket");
    expect(searchRes.length).toBeGreaterThanOrEqual(1);
    expect(searchRes[0].slug).toBe("system_design/rate-limiter");
  });

  it("should evaluate and grade MCQs from the catalog with detailed explanations", async () => {
    const publicQ = await mcqService.getQuestionsForDayPublic("day_1");
    expect(publicQ.length).toBeGreaterThanOrEqual(20);

    const targetQuestionId = publicQ[0].id;
    const submission = await mcqService.submitAnswer({
      userId: "test_quiz_taker",
      questionId: targetQuestionId,
      selectedOption: "A",
    });

    expect(submission.questionId).toBe(targetQuestionId);
    expect(submission.detailedExplanation).toBeDefined();
    expect(submission.correctOption).toBeDefined();
  });
});

