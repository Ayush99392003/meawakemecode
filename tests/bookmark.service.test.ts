import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { BookmarkService } from "../src/services/bookmark.service.js";
import { ProgressService } from "../src/services/progress.service.js";

describe("Component 7: Bookmarking & Spaced Revisit Queue", () => {
  let mockDb: MockFirestore;
  let bookmarkService: BookmarkService;
  let progressService: ProgressService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    bookmarkService = new BookmarkService(mockDb as any);
    progressService = new ProgressService(mockDb as any);
  });

  it("should toggle bookmark on and off", async () => {
    // First toggle: stars the problem
    const starRes = await bookmarkService.toggleBookmark({
      userId: "user_bm_1",
      itemType: "problem",
      itemId: "lc_1",
      label: "Revise before interview",
    });
    expect(starRes.bookmarked).toBe(true);
    expect(starRes.bookmark?.itemId).toBe("lc_1");

    // Second toggle: un-stars the problem
    const unstarRes = await bookmarkService.toggleBookmark({
      userId: "user_bm_1",
      itemType: "problem",
      itemId: "lc_1",
    });
    expect(unstarRes.bookmarked).toBe(false);

    const list = await bookmarkService.listBookmarks("user_bm_1");
    expect(list).toHaveLength(0);
  });

  it("should filter bookmarks by item type", async () => {
    await bookmarkService.toggleBookmark({
      userId: "user_bm_2",
      itemType: "problem",
      itemId: "lc_1",
    });
    await bookmarkService.toggleBookmark({
      userId: "user_bm_2",
      itemType: "day",
      itemId: "day_1",
    });
    await bookmarkService.toggleBookmark({
      userId: "user_bm_2",
      itemType: "library_page",
      itemId: "dsa/binary-trees",
    });

    const problemsOnly = await bookmarkService.listBookmarks("user_bm_2", "problem");
    expect(problemsOnly).toHaveLength(1);
    expect(problemsOnly[0].itemId).toBe("lc_1");

    const daysOnly = await bookmarkService.listBookmarks("user_bm_2", "day");
    expect(daysOnly).toHaveLength(1);
    expect(daysOnly[0].itemId).toBe("day_1");
  });

  it("should pull spaced-repetition candidates marked 'revisit' older than 7 days", async () => {
    const now = new Date("2026-11-05T12:00:00Z");

    // Problem marked revisit 10 days ago (older than 7 days)
    await progressService.updateProblemProgress({
      userId: "user_rev_1",
      problemId: "lc_15",
      status: "revisit",
      personalNote: "Tricky edge cases with duplicates",
    });

    // Manually set updatedAt to 10 days ago in mockDb
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    await (mockDb as any)
      .collection("users")
      .doc("user_rev_1")
      .collection("progress")
      .doc("lc_15")
      .set({ updatedAt: tenDaysAgo }, { merge: true });

    // Problem marked revisit 2 days ago (too recent for 7-day interval)
    await progressService.updateProblemProgress({
      userId: "user_rev_1",
      problemId: "lc_49",
      status: "revisit",
    });
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    await (mockDb as any)
      .collection("users")
      .doc("user_rev_1")
      .collection("progress")
      .doc("lc_49")
      .set({ updatedAt: twoDaysAgo }, { merge: true });

    const queue = await bookmarkService.getSpacedRevisitQueue("user_rev_1", 7, now);
    expect(queue).toHaveLength(1);
    expect(queue[0].problemId).toBe("lc_15");
  });
});

