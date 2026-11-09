import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { ProblemService } from "../src/services/problem.service.js";
import { LinkHealthService } from "../src/services/link-health.service.js";

describe("Component 2: Problem Catalogue Engine & Seeder", () => {
  let mockDb: MockFirestore;
  let problemService: ProblemService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    problemService = new ProblemService(mockDb as any);
  });

  it("should create a valid LeetCode problem", async () => {
    const problem = await problemService.createProblem({
      id: "lc_1",
      platform: "LC",
      externalId: "1",
      title: "Two Sum",
      url: "https://leetcode.com/problems/two-sum/",
      difficulty: "Easy",
      tags: ["Arrays", "Hash Table"],
      hint: "Use hash map",
      expectedTimeComplexity: "O(N)",
      expectedSpaceComplexity: "O(N)",
      expectedPattern: "Hash Map Complement",
      status: "active",
    });

    expect(problem.id).toBe("lc_1");
    expect(problem.platform).toBe("LC");
    expect(problem.lastCheckedAt).toBeDefined();

    const fetched = await problemService.getProblemById("lc_1");
    expect(fetched).not.toBeNull();
    expect(fetched?.title).toBe("Two Sum");
  });

  it("should create a valid Codeforces problem matching contestId + index pattern", async () => {
    const problem = await problemService.createProblem({
      id: "cf_1850A",
      platform: "CF",
      externalId: "1850A",
      title: "To My Critics",
      url: "https://codeforces.com/problemset/problem/1850/A",
      difficulty: "800",
      tags: ["math"],
      hint: null,
      expectedTimeComplexity: "O(1)",
      expectedSpaceComplexity: "O(1)",
      expectedPattern: null,
      status: "active",
    });

    expect(problem.id).toBe("cf_1850A");
    expect(problem.platform).toBe("CF");
    expect(problem.externalId).toBe("1850A");
  });

  it("should reject a Codeforces problem if externalId does not follow contestId+index format", async () => {
    await expect(
      problemService.createProblem({
        id: "cf_invalid",
        platform: "CF",
        externalId: "invalid-index",
        title: "Bad CF Problem",
        url: "https://codeforces.com/problemset/problem/bad",
        difficulty: "1000",
        tags: [],
        hint: null,
        expectedTimeComplexity: null,
        expectedSpaceComplexity: null,
        expectedPattern: null,
        status: "active",
      })
    ).rejects.toThrow(/Codeforces externalId must match/);
  });

  it("should filter problems by platform and tags", async () => {
    await problemService.createProblem({
      id: "lc_1",
      platform: "LC",
      externalId: "1",
      title: "Two Sum",
      url: "https://leetcode.com/problems/two-sum/",
      difficulty: "Easy",
      tags: ["Arrays", "Hash Table"],
      hint: null,
      expectedTimeComplexity: null,
      expectedSpaceComplexity: null,
      expectedPattern: null,
      status: "active",
    });

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

    const lcOnly = await problemService.listProblems({ platform: "LC" });
    expect(lcOnly).toHaveLength(1);
    expect(lcOnly[0].id).toBe("lc_1");

    const arraysOnly = await problemService.listProblems({ tag: "Arrays" });
    expect(arraysOnly).toHaveLength(1);
    expect(arraysOnly[0].id).toBe("lc_1");
  });

  it("should batch upsert problems (insert new and update existing)", async () => {
    const rawList = [
      {
        id: "lc_1",
        platform: "LC",
        externalId: "1",
        title: "Two Sum",
        url: "https://leetcode.com/problems/two-sum/",
        difficulty: "Easy",
        tags: ["Arrays"],
      },
      {
        id: "cf_158B",
        platform: "CF",
        externalId: "158B",
        title: "Taxi",
        url: "https://codeforces.com/problemset/problem/158/B",
        difficulty: "1100",
        tags: ["greedy"],
      },
    ];

    const firstRun = await problemService.batchUpsert(rawList);
    expect(firstRun.inserted).toBe(2);
    expect(firstRun.updated).toBe(0);

    // Update with modified difficulty
    rawList[0].difficulty = "Medium";
    const secondRun = await problemService.batchUpsert(rawList);
    expect(secondRun.inserted).toBe(0);
    expect(secondRun.updated).toBe(2);

    const updated = await problemService.getProblemById("lc_1");
    expect(updated?.difficulty).toBe("Medium");
  });
});

describe("LinkHealthService", () => {
  let mockDb: MockFirestore;
  let problemService: ProblemService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    problemService = new ProblemService(mockDb as any);
  });

  it("should detect active links (200 OK)", async () => {
    await problemService.createProblem({
      id: "lc_1",
      platform: "LC",
      externalId: "1",
      title: "Two Sum",
      url: "https://leetcode.com/problems/two-sum/",
      difficulty: "Easy",
      tags: [],
      hint: null,
      expectedTimeComplexity: null,
      expectedSpaceComplexity: null,
      expectedPattern: null,
      status: "active",
    });

    const mockFetch = async () => ({ status: 200, ok: true });
    const healthService = new LinkHealthService(problemService, mockFetch);

    const result = await healthService.verifyAndUpdateProblem("lc_1");
    expect(result.status).toBe("active");
    expect(result.statusCode).toBe(200);
  });

  it("should detect and update broken links (404 Not Found)", async () => {
    await problemService.createProblem({
      id: "cf_broken",
      platform: "CF",
      externalId: "99999Z",
      title: "Non-existent CF problem",
      url: "https://codeforces.com/problemset/problem/99999/Z",
      difficulty: "1000",
      tags: [],
      hint: null,
      expectedTimeComplexity: null,
      expectedSpaceComplexity: null,
      expectedPattern: null,
      status: "active",
    });

    const mockFetch = async () => ({ status: 404, ok: false });
    const healthService = new LinkHealthService(problemService, mockFetch);

    const result = await healthService.verifyAndUpdateProblem("cf_broken");
    expect(result.status).toBe("broken_link");

    const updated = await problemService.getProblemById("cf_broken");
    expect(updated?.status).toBe("broken_link");
  });
});

