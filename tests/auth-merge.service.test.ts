import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { AuthService } from "../src/services/auth.service.js";
import { MergeService } from "../src/services/merge.service.js";

describe("Component 8: Passwordless Auth & Guest-to-User State Merge", () => {
  let mockDb: MockFirestore;
  let authService: AuthService;
  let mergeService: MergeService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    authService = new AuthService(mockDb as any);
    mergeService = new MergeService(mockDb as any);
  });

  it("should generate a 15-minute single-use magic link token", async () => {
    const { rawToken, expiresAt, userId } = await authService.generateMagicLink("student@example.com");

    expect(rawToken).toBeDefined();
    expect(userId).toBeDefined();

    // Verify expiresAt is ~15 minutes from now
    const expiryDiff = new Date(expiresAt).getTime() - Date.now();
    expect(expiryDiff).toBeGreaterThan(14 * 60 * 1000);
    expect(expiryDiff).toBeLessThanOrEqual(15 * 60 * 1000);
  });

  it("should verify valid magic token and initialize user profile", async () => {
    const { rawToken } = await authService.generateMagicLink("developer@example.com");

    const session = await authService.verifyMagicToken(rawToken);
    expect(session.email).toBe("developer@example.com");

    const profile = await authService.getUserProfile(session.userId);
    expect(profile).not.toBeNull();
    expect(profile?.email).toBe("developer@example.com");
    expect(profile?.verifiedAt).toBeDefined();
    expect(profile?.preferredLanguage).toBe("cpp");
    expect(profile?.strictMode).toBe(false);
  });

  it("should reject token reuse (single-use guarantee)", async () => {
    const { rawToken } = await authService.generateMagicLink("test@example.com");

    // First use succeeds
    await authService.verifyMagicToken(rawToken);

    // Second use must fail
    await expect(authService.verifyMagicToken(rawToken)).rejects.toThrow(
      /Authentication link has already been used/
    );
  });

  it("should reject expired tokens", async () => {
    const { rawToken } = await authService.generateMagicLink("expired@example.com");
    const tokenHash = AuthService.hashToken(rawToken);

    // Force expire the token in database
    const pastTime = new Date(Date.now() - 1000).toISOString();
    await (mockDb as any).collection("login_tokens").doc(tokenHash).update({ expiresAt: pastTime });

    await expect(authService.verifyMagicToken(rawToken)).rejects.toThrow(
      /Authentication link has expired/
    );
  });

  it("should merge guest state into cloud resolving conflicts by latest timestamp", async () => {
    const userId = "user_merge_target";
    await authService.ensureUserProfile(userId, "merge@test.com");

    // Pre-existing cloud record for lc_1 (timestamp: 10:00 AM)
    const oldCloudTime = "2026-11-05T10:00:00Z";
    await (mockDb as any)
      .collection("users")
      .doc(userId)
      .collection("progress")
      .doc("lc_1")
      .set({
        problemId: "lc_1",
        status: "started",
        updatedAt: oldCloudTime,
      });

    // Pre-existing cloud record for lc_217 (timestamp: 12:00 PM - MORE RECENT)
    const newCloudTime = "2026-11-05T12:00:00Z";
    await (mockDb as any)
      .collection("users")
      .doc(userId)
      .collection("progress")
      .doc("lc_217")
      .set({
        problemId: "lc_217",
        status: "solved",
        solvedAt: newCloudTime,
        updatedAt: newCloudTime,
      });

    // Guest payload:
    // lc_1: guest is NEWER (11:00 AM > 10:00 AM) -> should overwrite cloud
    // lc_217: guest is OLDER (09:00 AM < 12:00 PM) -> cloud should win (ignored)
    // lc_49: new problem not in cloud -> added
    const guestPayload = {
      progress: [
        {
          problemId: "lc_1",
          status: "solved" as const,
          solvedAt: "2026-11-05T11:00:00Z",
          attemptsCount: 1,
          updatedAt: "2026-11-05T11:00:00Z",
        },
        {
          problemId: "lc_217",
          status: "not_started" as const,
          attemptsCount: 0,
          updatedAt: "2026-11-05T09:00:00Z",
        },
        {
          problemId: "lc_49",
          status: "solved" as const,
          solvedAt: "2026-11-05T11:30:00Z",
          attemptsCount: 1,
          updatedAt: "2026-11-05T11:30:00Z",
        },
      ],
      bookmarks: [
        {
          itemType: "problem" as const,
          itemId: "lc_1",
          createdAt: "2026-11-05T11:00:00Z",
        },
      ],
      mcqAttempts: [
        {
          questionId: "mcq_day1_1",
          selectedOption: "C" as const,
          isCorrect: true,
          attemptedAt: "2026-11-05T11:15:00Z",
        },
      ],
      dayProgress: [
        {
          dayId: "day_1",
          completedAt: "2026-11-05T11:45:00Z",
        },
      ],
    };

    const mergeRes = await mergeService.mergeGuestState(userId, guestPayload);
    expect(mergeRes.problemsMerged).toBe(2); // lc_1 overwritten + lc_49 inserted
    expect(mergeRes.bookmarksMerged).toBe(1);
    expect(mergeRes.mcqAttemptsMerged).toBe(1);
    expect(mergeRes.daysMerged).toBe(1);

    // Verify lc_1 is now solved (guest won)
    const lc1Doc = await (mockDb as any)
      .collection("users")
      .doc(userId)
      .collection("progress")
      .doc("lc_1")
      .get();
    expect(lc1Doc.data().status).toBe("solved");

    // Verify lc_217 is still solved with the newer cloud timestamp (cloud won)
    const lc217Doc = await (mockDb as any)
      .collection("users")
      .doc(userId)
      .collection("progress")
      .doc("lc_217")
      .get();
    expect(lc217Doc.data().status).toBe("solved");
    expect(lc217Doc.data().updatedAt).toBe(newCloudTime);
  });
});

