import { getFirestoreDb } from "../db/firestore.js";

export interface SM2State {
  repetition: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: string; // ISO date string (YYYY-MM-DD)
  lastReviewedAt: string; // ISO timestamp
  lastQualityScore: number; // 0 to 5
}

export interface ReviewItem {
  id: string;
  userId: string;
  itemId: string;
  itemType: "problem" | "mcq" | "library_page";
  sm2: SM2State;
  createdAt: string;
  updatedAt: string;
}

export class SpacedRepetitionService {
  private collectionName = "spaced_reviews";

  constructor(private db: any = getFirestoreDb()) {}

  /**
   * SuperMemo SM-2 Core Algorithm calculation.
   * @param quality User rating from 0 (complete blackout) to 5 (perfect recall).
   * @param currentRepetition Number of consecutive successful recalls.
   * @param currentInterval Days until the current review.
   * @param currentEaseFactor Difficulty factor (default: 2.5, minimum: 1.3).
   */
  static calculateSM2(
    quality: number,
    currentRepetition: number = 0,
    currentInterval: number = 0,
    currentEaseFactor: number = 2.5
  ): { repetition: number; intervalDays: number; easeFactor: number } {
    // Quality clamped between 0 and 5
    const q = Math.max(0, Math.min(5, Math.round(quality)));

    // Calculate new Ease Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    let newEaseFactor = currentEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3;
    }

    let newRepetition = currentRepetition;
    let newIntervalDays = currentInterval;

    if (q < 3) {
      // Failed recall: reset repetitions back to 0 and schedule review tomorrow
      newRepetition = 0;
      newIntervalDays = 1;
    } else {
      // Successful recall
      if (currentRepetition === 0) {
        newIntervalDays = 1;
      } else if (currentRepetition === 1) {
        newIntervalDays = 6;
      } else {
        newIntervalDays = Math.round(currentInterval * newEaseFactor);
      }
      newRepetition = currentRepetition + 1;
    }

    return {
      repetition: newRepetition,
      intervalDays: newIntervalDays,
      easeFactor: Number(newEaseFactor.toFixed(3)),
    };
  }

  /**
   * Records a user's review outcome and calculates the next review date.
   */
  async recordReview(
    userId: string,
    itemType: "problem" | "mcq" | "library_page",
    itemId: string,
    qualityScore: number,
    referenceDate: Date = new Date()
  ): Promise<ReviewItem> {
    const docId = `${itemType}_${itemId.replace(/\//g, "___")}`;
    const docRef = this.db.collection("users").doc(userId).collection(this.collectionName).doc(docId);

    const existingDoc = await docRef.get();
    const existing = existingDoc.exists ? (existingDoc.data() as ReviewItem) : null;

    const currentRep = existing?.sm2.repetition ?? 0;
    const currentInt = existing?.sm2.intervalDays ?? 0;
    const currentEF = existing?.sm2.easeFactor ?? 2.5;

    const { repetition, intervalDays, easeFactor } = SpacedRepetitionService.calculateSM2(
      qualityScore,
      currentRep,
      currentInt,
      currentEF
    );

    const nextDate = new Date(referenceDate);
    nextDate.setDate(nextDate.getDate() + intervalDays);
    const nextReviewDateStr = nextDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const nowIso = new Date().toISOString();

    const reviewItem: ReviewItem = {
      id: docId,
      userId,
      itemId,
      itemType,
      sm2: {
        repetition,
        intervalDays,
        easeFactor,
        nextReviewDate: nextReviewDateStr,
        lastReviewedAt: nowIso,
        lastQualityScore: qualityScore,
      },
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
    };

    await docRef.set(reviewItem);
    return reviewItem;
  }

  /**
   * Retrieves all items that are due for spaced repetition review today or earlier.
   */
  async getDueReviews(
    userId: string,
    referenceDate: Date = new Date()
  ): Promise<ReviewItem[]> {
    const todayStr = referenceDate.toISOString().split("T")[0];
    const snapshot = await this.db.collection("users").doc(userId).collection(this.collectionName).get();

    const items: ReviewItem[] = snapshot.docs.map((d: any) => d.data() as ReviewItem);

    return items
      .filter((item) => item.sm2.nextReviewDate <= todayStr)
      .sort((a, b) => a.sm2.nextReviewDate.localeCompare(b.sm2.nextReviewDate));
  }
}

