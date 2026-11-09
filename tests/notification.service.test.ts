import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { ProgressService } from "../src/services/progress.service.js";
import { CurriculumService } from "../src/services/curriculum.service.js";
import { NotificationService, EmailDispatchPayload } from "../src/services/notification.service.js";
import { UserProfile } from "../src/types/index.js";

describe("Component 10: Notification Scheduler & Email Engine", () => {
  let mockDb: MockFirestore;
  let progressService: ProgressService;
  let curriculumService: CurriculumService;
  let sentEmails: EmailDispatchPayload[];
  let notificationService: NotificationService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    progressService = new ProgressService(mockDb as any);
    curriculumService = new CurriculumService(mockDb as any);
    sentEmails = [];

    const mockSender = async (payload: EmailDispatchPayload) => {
      sentEmails.push(payload);
      return { success: true, messageId: "msg_123" };
    };

    notificationService = new NotificationService(
      progressService,
      curriculumService,
      mockDb as any,
      mockSender
    );
  });

  const baseUser: UserProfile = {
    id: "user_notif_1",
    email: "learner@example.com",
    verifiedAt: "2026-11-01T00:00:00Z",
    timezone: "UTC",
    preferredLanguage: "cpp",
    reminderTime: "20:00",
    reminderPrefs: {
      daily: true,
      nudges: true,
      weeklyDigest: true,
    },
    cfHandle: null,
    strictMode: false,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  };

  it("should send daily reminder when user local time matches reminder hour", async () => {
    // 20:15 UTC (matches user's 20:00 hour)
    const refDate = new Date("2026-11-05T20:15:00Z");

    const result = await notificationService.evaluateAndSendForUser(baseUser, refDate);
    expect(result.sent).toContain("daily_reminder");
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("learner@example.com");
    expect(sentEmails[0].type).toBe("daily_reminder");
  });

  it("should enforce strict idempotency (never send twice in the same window)", async () => {
    const refDate = new Date("2026-11-05T20:15:00Z");

    // First call sends
    const firstRun = await notificationService.evaluateAndSendForUser(baseUser, refDate);
    expect(firstRun.sent).toContain("daily_reminder");

    // Second call in same window must skip
    const secondRun = await notificationService.evaluateAndSendForUser(baseUser, refDate);
    expect(secondRun.sent).toHaveLength(0);
    expect(secondRun.skipped).toContain("daily_reminder");
    expect(sentEmails).toHaveLength(1); // Still only 1 email sent!
  });

  it("should trigger streak-at-risk email when user has streak >= 3 and 0 solves today", async () => {
    // Create 3 days of active solves (Nov 2, Nov 3, Nov 4)
    await progressService.updateProblemProgress({
      userId: baseUser.id,
      problemId: "lc_1",
      status: "solved",
      solvedAt: "2026-11-02T12:00:00Z",
    });
    await progressService.updateProblemProgress({
      userId: baseUser.id,
      problemId: "lc_217",
      status: "solved",
      solvedAt: "2026-11-03T12:00:00Z",
    });
    await progressService.updateProblemProgress({
      userId: baseUser.id,
      problemId: "lc_49",
      status: "solved",
      solvedAt: "2026-11-04T12:00:00Z",
    });

    // Today is Nov 5 at 20:00 (evening, user has 0 solves today)
    const refDate = new Date("2026-11-05T20:00:00Z");

    const result = await notificationService.evaluateAndSendForUser(baseUser, refDate);
    expect(result.sent).toContain("streak_at_risk");

    const riskMail = sentEmails.find((e) => e.type === "streak_at_risk");
    expect(riskMail).toBeDefined();
    expect(riskMail?.subject).toContain("3-day streak is at risk");
  });

  it("should trigger inactivity nudge on Day 1 and Day 3, but not Day 2 or Day 4+", async () => {
    // Solved on Nov 1
    await progressService.updateProblemProgress({
      userId: baseUser.id,
      problemId: "lc_1",
      status: "solved",
      solvedAt: "2026-11-01T12:00:00Z",
    });

    // Ref date: Nov 2 (1 day inactive -> trigger nudge_day1)
    const day1Inactive = new Date("2026-11-02T12:00:00Z");
    const res1 = await notificationService.evaluateAndSendForUser(
      { ...baseUser, reminderPrefs: { daily: false, nudges: true, weeklyDigest: false } },
      day1Inactive
    );
    expect(res1.sent).toContain("nudge_day1");

    // Ref date: Nov 3 (2 days inactive -> no nudge per spec)
    const day2Inactive = new Date("2026-11-03T12:00:00Z");
    const res2 = await notificationService.evaluateAndSendForUser(
      { ...baseUser, reminderPrefs: { daily: false, nudges: true, weeklyDigest: false } },
      day2Inactive
    );
    expect(res2.sent).toHaveLength(0);

    // Ref date: Nov 4 (3 days inactive -> trigger final nudge_day3)
    const day3Inactive = new Date("2026-11-04T12:00:00Z");
    const res3 = await notificationService.evaluateAndSendForUser(
      { ...baseUser, reminderPrefs: { daily: false, nudges: true, weeklyDigest: false } },
      day3Inactive
    );
    expect(res3.sent).toContain("nudge_day3");

    // Ref date: Nov 6 (5 days inactive -> stops forever per spec)
    const day5Inactive = new Date("2026-11-06T12:00:00Z");
    const res5 = await notificationService.evaluateAndSendForUser(
      { ...baseUser, reminderPrefs: { daily: false, nudges: true, weeklyDigest: false } },
      day5Inactive
    );
    expect(res5.sent).toHaveLength(0);
  });
});

