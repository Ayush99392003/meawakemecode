import { GuestMergePayloadSchema } from "../schemas/auth-merge.schema.js";
import { UserProblemProgress, Bookmark, UserDayProgress, UserMCQAttempt } from "../types/index.js";
import { getFirestoreDb } from "../db/firestore.js";

export interface MergeResult {
  userId: string;
  problemsMerged: number;
  bookmarksMerged: number;
  mcqAttemptsMerged: number;
  daysMerged: number;
}

export class MergeService {
  constructor(private db: any = getFirestoreDb()) { }

  async mergeGuestState(userId: string, rawPayload: unknown): Promise<MergeResult> {
    const payload = GuestMergePayloadSchema.parse(rawPayload);

    let problemsMerged = 0;
    let bookmarksMerged = 0;
    let mcqAttemptsMerged = 0;
    let daysMerged = 0;

    // 1. Merge Progress with Conflict Resolution by Latest Timestamp
    const userProgressCol = this.db.collection("users").doc(userId).collection("progress");

    for (const guestItem of payload.progress) {
      const docRef = userProgressCol.doc(guestItem.problemId);
      const cloudDoc = await docRef.get();

      if (!cloudDoc.exists) {
        await docRef.set(guestItem);
        problemsMerged++;
      } else {
        const cloudData = cloudDoc.data() as UserProblemProgress;
        const cloudTime = new Date(cloudData.updatedAt || cloudData.solvedAt || 0).getTime();
        const guestTime = new Date(guestItem.updatedAt || guestItem.solvedAt || 0).getTime();

        if (guestTime > cloudTime) {
          // Guest record is more recent: overwrite cloud with guest
          await docRef.set(guestItem);
          problemsMerged++;
        }
      }
    }

    // 2. Merge Bookmarks
    const userBookmarksCol = this.db.collection("users").doc(userId).collection("bookmarks");

    for (const b of payload.bookmarks) {
      const sanitizedItemId = b.itemId.replace(/\//g, "___");
      const bookmarkId = `${b.itemType}_${sanitizedItemId}`;
      const docRef = userBookmarksCol.doc(bookmarkId);
      const existing = await docRef.get();

      if (!existing.exists) {
        const bookmark: Bookmark = {
          id: bookmarkId,
          userId,
          itemType: b.itemType,
          itemId: b.itemId,
          label: b.label ?? null,
          createdAt: b.createdAt,
        };
        await docRef.set(bookmark);
        bookmarksMerged++;
      }
    }

    // 3. Merge MCQ Attempts
    const userMCQCol = this.db.collection("users").doc(userId).collection("mcq_attempts");

    for (const attempt of payload.mcqAttempts) {
      const docRef = userMCQCol.doc(attempt.questionId);
      const existing = await docRef.get();

      if (!existing.exists) {
        const fullAttempt: UserMCQAttempt = {
          id: attempt.questionId,
          userId,
          questionId: attempt.questionId,
          selectedOption: attempt.selectedOption,
          isCorrect: attempt.isCorrect,
          attemptedAt: attempt.attemptedAt,
        };
        await docRef.set(fullAttempt);
        mcqAttemptsMerged++;
      }
    }

    // 4. Merge Day Progress
    const userDayCol = this.db.collection("users").doc(userId).collection("day_progress");

    for (const d of payload.dayProgress) {
      const docRef = userDayCol.doc(d.dayId);
      const existing = await docRef.get();

      if (!existing.exists) {
        const dayRecord: UserDayProgress = {
          dayId: d.dayId,
          completedAt: d.completedAt,
        };
        await docRef.set(dayRecord);
        daysMerged++;
      }
    }

    return {
      userId,
      problemsMerged,
      bookmarksMerged,
      mcqAttemptsMerged,
      daysMerged,
    };
  }
}

