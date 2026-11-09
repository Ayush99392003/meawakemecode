import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { ProblemService } from "../src/services/problem.service.js";
import { CurriculumService } from "../src/services/curriculum.service.js";
import { AdminService } from "../src/services/admin.service.js";
import { AuthService } from "../src/services/auth.service.js";

describe("Component 11: Admin Management API & Analytics", () => {
  let mockDb: MockFirestore;
  let problemService: ProblemService;
  let curriculumService: CurriculumService;
  let authService: AuthService;
  let adminService: AdminService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    problemService = new ProblemService(mockDb as any);
    curriculumService = new CurriculumService(mockDb as any);
    authService = new AuthService(mockDb as any);
    adminService = new AdminService(problemService, curriculumService, mockDb as any);
  });

  it("should create announcements", async () => {
    const ann = await adminService.createAnnouncement(
      "Week 1 Live Discussion",
      "Join us this Saturday for a live review of Two Pointers and Binary Search patterns."
    );

    expect(ann.id).toBeDefined();
    expect(ann.title).toBe("Week 1 Live Discussion");
    expect(ann.postedAt).toBeDefined();
  });

  it("should compute accurate platform funnel metrics", async () => {
    // Create 3 users
    await authService.ensureUserProfile("user_1", "user1@test.com");
    await authService.ensureUserProfile("user_2", "user2@test.com");
    await authService.ensureUserProfile("user_3", "user3@test.com");

    // user_1 completed Day 1 and Day 7
    await (mockDb as any).collection("users").doc("user_1").collection("day_progress").doc("day_1").set({ completedAt: new Date().toISOString() });
    await (mockDb as any).collection("users").doc("user_1").collection("day_progress").doc("day_7").set({ completedAt: new Date().toISOString() });

    // user_2 completed Day 1 only
    await (mockDb as any).collection("users").doc("user_2").collection("day_progress").doc("day_1").set({ completedAt: new Date().toISOString() });

    // user_3 has 0 days completed

    // Add 1 active problem and 1 broken link problem
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

    await problemService.createProblem({
      id: "lc_broken",
      platform: "LC",
      externalId: "999",
      title: "Old Broken Problem",
      url: "https://leetcode.com/problems/broken-slug/",
      difficulty: "Easy",
      tags: [],
      hint: null,
      expectedTimeComplexity: null,
      expectedSpaceComplexity: null,
      expectedPattern: null,
      status: "broken_link",
    });

    const metrics = await adminService.getPlatformFunnelMetrics();
    expect(metrics.totalRegisteredUsers).toBe(3);
    expect(metrics.usersCompletedDay1).toBe(2);
    expect(metrics.usersCompletedDay7).toBe(1);
    expect(metrics.usersCompletedDay30).toBe(0);
    expect(metrics.brokenProblemsCount).toBe(1);
  });
});

