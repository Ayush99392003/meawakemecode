import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { AuthService } from "../src/services/auth.service.js";
import { SubscriptionService } from "../src/services/subscription.service.js";
import { NotificationService, EmailDispatchPayload } from "../src/services/notification.service.js";
import { CurriculumService } from "../src/services/curriculum.service.js";
import { ProblemService } from "../src/services/problem.service.js";
import { ProgressService } from "../src/services/progress.service.js";
import { EmailTemplateService } from "../src/services/email-template.service.js";
import { seedMasterDatabase } from "../scripts/seed-master-database.js";

describe("Login, Preferences & Email Itinerary Reminder System", () => {
  let mockDb: MockFirestore;
  let authService: AuthService;
  let subscriptionService: SubscriptionService;
  let curriculumService: CurriculumService;
  let problemService: ProblemService;
  let progressService: ProgressService;
  let notificationService: NotificationService;
  let sentMails: EmailDispatchPayload[];

  beforeEach(async () => {
    mockDb = new MockFirestore();
    await seedMasterDatabase(mockDb as any);

    authService = new AuthService(mockDb as any);
    subscriptionService = new SubscriptionService(mockDb as any);
    curriculumService = new CurriculumService(mockDb as any);
    problemService = new ProblemService(mockDb as any);
    progressService = new ProgressService(mockDb as any);
    sentMails = [];

    const mockSender = async (payload: EmailDispatchPayload) => {
      sentMails.push(payload);
      return { success: true, messageId: "mock_id" };
    };

    notificationService = new NotificationService(
      progressService,
      curriculumService,
      mockDb as any,
      mockSender,
      problemService
    );
  });

  it("should allow user to subscribe to daily reminders at their preferred time and timezone", async () => {
    const user = await authService.ensureUserProfile("usr_sub_1", "student@university.edu");
    expect(user.subscriptionStatus).toBe("active");
    expect(user.unsubscribeToken).toBeDefined();

    // User sets their reminder to 08:30 AM in Asia/Kolkata
    const updated = await subscriptionService.subscribeToReminders(user.id, {
      reminderTime: "08:30",
      timezone: "Asia/Kolkata",
      daily: true,
      streakWarning: true,
    });

    expect(updated.reminderTime).toBe("08:30");
    expect(updated.timezone).toBe("Asia/Kolkata");
    expect(updated.reminderPrefs.daily).toBe(true);
  });

  it("should reject invalid reminder times and invalid timezones", async () => {
    const user = await authService.ensureUserProfile("usr_sub_err", "err@test.com");

    await expect(
      subscriptionService.subscribeToReminders(user.id, {
        reminderTime: "25:00", // Invalid hour
        timezone: "UTC",
      })
    ).rejects.toThrow(/Invalid reminder time format/);

    await expect(
      subscriptionService.subscribeToReminders(user.id, {
        reminderTime: "09:00",
        timezone: "Invalid/Fake_Zone", // Invalid timezone
      })
    ).rejects.toThrow(/Invalid IANA timezone/);
  });

  it("should format a rich daily email with that day's complete 5-problem itinerary", async () => {
    const user = await authService.ensureUserProfile("usr_sub_itinerary", "coder@gmail.com");
    await subscriptionService.subscribeToReminders(user.id, {
      reminderTime: "20:00",
      timezone: "America/New_York",
      daily: true,
    });

    const day1 = await curriculumService.getDayByNumber(1);
    expect(day1).not.toBeNull();

    const problems = [];
    for (const pid of day1!.problemIds) {
      const p = await problemService.getProblemById(pid);
      if (p) problems.push(p);
    }
    expect(problems).toHaveLength(5);

    const streaks = {
      currentStreak: 3,
      longestStreak: 5,
      totalDaysActive: 7,
      lastActiveLocalDate: "2026-11-04",
    };

    const formatted = EmailTemplateService.buildDailyItineraryEmail(user, day1!, problems, streaks);

    // Verify Subject
    expect(formatted.subject).toContain("Day 1/30");
    expect(formatted.subject).toContain("Arrays & Hash Maps");
    expect(formatted.subject).toContain("3-Day Streak");

    // Verify HTML contains all 5 problem titles and direct solve URLs
    expect(formatted.html).toContain("Two Sum");
    expect(formatted.html).toContain("Contains Duplicate");
    expect(formatted.html).toContain("Group Anagrams");
    expect(formatted.html).toContain("To My Critics");
    expect(formatted.html).toContain("Taxi");
    expect(formatted.html).toContain("LeetCode");
    expect(formatted.html).toContain("Codeforces");
    expect(formatted.html).toContain("1-Click Unsubscribe");
    expect(formatted.html).toContain(user.unsubscribeToken);

    // Verify Plain text contains problem list
    expect(formatted.text).toContain("TODAY'S 5-PROBLEM ITINERARY:");
    expect(formatted.text).toContain("https://leetcode.com/problems/two-sum/");
  });

  it("should dispatch the rich itinerary email when cron matches user reminder time", async () => {
    const user = await authService.ensureUserProfile("usr_cron_user", "cron@daily.com");
    const updatedUser = await subscriptionService.subscribeToReminders(user.id, {
      reminderTime: "07:00",
      timezone: "UTC",
      daily: true,
    });

    // Reference clock at 07:15 UTC (matches 07:00 hour)
    const refClock = new Date("2026-11-05T07:15:00Z");

    const result = await notificationService.evaluateAndSendForUser(updatedUser, refClock);
    expect(result.sent).toContain("daily_reminder");
    expect(sentMails).toHaveLength(1);

    const sent = sentMails[0];
    expect(sent.to).toBe("cron@daily.com");
    expect(sent.subject).toContain("Day 1");
    expect(sent.html).toContain("Two Sum");
  });

  it("should support 1-click unsubscribe and cease sending reminder emails", async () => {
    const user = await authService.ensureUserProfile("usr_unsub_test", "unsub@test.com");
    await subscriptionService.subscribeToReminders(user.id, {
      reminderTime: "12:00",
      timezone: "UTC",
      daily: true,
    });

    // User clicks the 1-click unsubscribe link from their email
    const unsubResult = await subscriptionService.unsubscribe(user.id, user.unsubscribeToken);
    expect(unsubResult.success).toBe(true);

    const updatedProfile = await authService.getUserProfile(user.id);
    expect(updatedProfile?.subscriptionStatus).toBe("unsubscribed");
    expect(updatedProfile?.reminderPrefs.daily).toBe(false);

    // Cron runs at 12:00 UTC -> should NOT send any emails
    const refClock = new Date("2026-11-05T12:00:00Z");
    const cronResult = await notificationService.evaluateAndSendForUser(updatedProfile!, refClock);

    expect(cronResult.sent).toHaveLength(0);
    expect(sentMails).toHaveLength(0);
  });
});
