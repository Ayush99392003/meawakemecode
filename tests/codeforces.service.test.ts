import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { ProblemService } from "../src/services/problem.service.js";
import { ProgressService } from "../src/services/progress.service.js";
import { CodeforcesService } from "../src/services/codeforces.service.js";

describe("Component 6: Codeforces Sync & Verification Service", () => {
  let mockDb: MockFirestore;
  let problemService: ProblemService;
  let progressService: ProgressService;

  beforeEach(async () => {
    mockDb = new MockFirestore();
    problemService = new ProblemService(mockDb as any);
    progressService = new ProgressService(mockDb as any);

    // Pre-populate catalog with 2 Codeforces problems
    await problemService.createProblem({
      id: "cf_1850A",
      platform: "CF",
      externalId: "1850A",
      title: "To My Critics",
      url: "https://codeforces.com/problemset/problem/1850/A",
      difficulty: "800",
      tags: ["math"],
      hint: null,
      expectedTimeComplexity: null,
      expectedSpaceComplexity: null,
      expectedPattern: null,
      status: "active",
    });

    await problemService.createProblem({
      id: "cf_158B",
      platform: "CF",
      externalId: "158B",
      title: "Taxi",
      url: "https://codeforces.com/problemset/problem/158/B",
      difficulty: "1100",
      tags: ["greedy"],
      hint: null,
      expectedTimeComplexity: null,
      expectedSpaceComplexity: null,
      expectedPattern: null,
      status: "active",
    });
  });

  it("should match accepted submissions and auto-verify problems", async () => {
    const mockCfApiResponse = {
      status: "OK",
      result: [
        {
          id: 1001,
          contestId: 1850,
          creationTimeSeconds: 1689516000,
          problem: { contestId: 1850, index: "A", name: "To My Critics" },
          verdict: "OK", // Accepted
        },
        {
          id: 1002,
          contestId: 158,
          creationTimeSeconds: 1689517000,
          problem: { contestId: 158, index: "B", name: "Taxi" },
          verdict: "WRONG_ANSWER", // NOT accepted
        },
      ],
    };

    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => mockCfApiResponse,
    });

    const cfService = new CodeforcesService(problemService, progressService, mockFetch as any);
    const syncRes = await cfService.syncUserHandle("user_cf_1", "tourist");

    expect(syncRes.acceptedSubmissions).toBe(1);
    expect(syncRes.verifiedCount).toBe(1);
    expect(syncRes.autoSolvedProblemIds).toEqual(["cf_1850A"]);

    // Verify progress updated
    const summary = await progressService.getDayProgressSummary("user_cf_1", "day_1", ["cf_1850A", "cf_158B"]);
    const cf1850A = summary.problems.find((p) => p.problemId === "cf_1850A");
    const cf158B = summary.problems.find((p) => p.problemId === "cf_158B");

    expect(cf1850A?.status).toBe("solved");
    expect(cf158B?.status).toBe("not_started");
  });

  it("should enforce rate limiting on back-to-back calls", async () => {
    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ status: "OK", result: [] }),
    });

    const cfService = new CodeforcesService(problemService, progressService, mockFetch as any);

    // First call succeeds
    await cfService.syncUserHandle("user_cf_2", "unique_handle_123");

    // Immediate second call should be blocked by rate limiter
    await expect(
      cfService.syncUserHandle("user_cf_2", "unique_handle_123")
    ).rejects.toThrow(/rate limit: Please wait/);
  });
});

