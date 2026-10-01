import { UserProblemProgress, UserDayProgress, ProblemStatus } from "../types/index.js";
import { UpdateProblemProgressSchema } from "../schemas/progress.schema.js";
import { StreakService, StreakResult } from "./streak.service.js";
import { getFirestoreDb } from "../db/firestore.js";

export interface DayProgressSummary {
  dayId: string;
  totalProblems: number;
  solvedCount: number;
  isDayCompleted: boolean;
  problems: UserProblemProgress[];
}

export class ProgressService {
  constructor(private db: any = getFirestoreDb()) {}

  async updateProblemProgress(input: unknown, dayContext?: { dayId: string; dayProblemIds: string[] }): Promise<{
    progress: UserProblemProgress;
    dayJustCompleted: boolean;
  }> {
    const validated = UpdateProblemProgressSchema.parse(input);
    const now = new Date().toISOString();

    const userProgressRef = this.db
      .collection("users")
      .doc(validated.userId)
      .collection("progress")
      .doc(validated.problemId);

    const existingDoc = await userProgressRef.get();
    const existing = existingDoc.exists ? (existingDoc.data() as UserProblemProgress) : null;

    const solvedAt =
      validated.status === "solved"
        ? validated.solvedAt || existing?.solvedAt || now
        : null;

    const progressRecord: UserProblemProgress = {
      problemId: validated.problemId,
      status: validated.status,
      solvedAt,
      attemptsCount: validated.attemptsCount ?? existing?.attemptsCount ?? 0,
      personalTimeSeconds: validated.personalTimeSeconds ?? existing?.personalTimeSeconds ?? null,
      personalNote: validated.personalNote ?? existing?.personalNote ?? null,
      updatedAt: now,
    };

    await userProgressRef.set(progressRecord, { merge: true });

    // Check if day completed
    let dayJustCompleted = false;
    if (dayContext && validated.status === "solved") {
      const { dayId, dayProblemIds } = dayContext;
      const allSolved = await this.areAllProblemsSolved(validated.userId, dayProblemIds);

      if (allSolved) {
        const dayProgressRef = this.db
          .collection("users")
          .doc(validated.userId)
          .collection("day_progress")
          .doc(dayId);

        const dayDoc = await dayProgressRef.get();
        if (!dayDoc.exists) {
          const dayRecord: UserDayProgress = {
            dayId,
            completedAt: now,
          };
          await dayProgressRef.set(dayRecord);
          dayJustCompleted = true;
        }
      }
    }

    return { progress: progressRecord, dayJustCompleted };
  }

  async areAllProblemsSolved(userId: string, problemIds: string[]): Promise<boolean> {
    for (const pid of problemIds) {
      const doc = await this.db
        .collection("users")
        .doc(userId)
        .collection("progress")
        .doc(pid)
        .get();

      if (!doc.exists) return false;
      const data = doc.data() as UserProblemProgress;
      if (data.status !== "solved") return false;
    }
    return true;
  }

  async getDayProgressSummary(
    userId: string,
    dayId: string,
    problemIds: string[]
  ): Promise<DayProgressSummary> {
    const problems: UserProblemProgress[] = [];
    let solvedCount = 0;

    for (const pid of problemIds) {
      const doc = await this.db
        .collection("users")
        .doc(userId)
        .collection("progress")
        .doc(pid)
        .get();

      if (doc.exists) {
        const data = doc.data() as UserProblemProgress;
        problems.push(data);
        if (data.status === "solved") solvedCount++;
      } else {
        problems.push({
          problemId: pid,
          status: "not_started",
          solvedAt: null,
          attemptsCount: 0,
          personalTimeSeconds: null,
          personalNote: null,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const dayDoc = await this.db
      .collection("users")
      .doc(userId)
      .collection("day_progress")
      .doc(dayId)
      .get();

    return {
      dayId,
      totalProblems: problemIds.length,
      solvedCount,
      isDayCompleted: dayDoc.exists || (problemIds.length > 0 && solvedCount === problemIds.length),
      problems,
    };
  }

  async getAllCompletedDayNumbers(userId: string): Promise<Set<number>> {
    const snapshot = await this.db
      .collection("users")
      .doc(userId)
      .collection("day_progress")
      .get();

    const set = new Set<number>();
    for (const doc of snapshot.docs) {
      const dayId = doc.id; // e.g. "day_1"
      const match = dayId.match(/\d+$/);
      if (match) {
        set.add(parseInt(match[0], 10));
      }
    }
    return set;
  }

  async getUserStreaks(
    userId: string,
    timezone: string = "UTC",
    referenceDate?: Date
  ): Promise<StreakResult> {
    const snapshot = await this.db
      .collection("users")
      .doc(userId)
      .collection("progress")
      .where("status", "==", "solved")
      .get();

    const solvedTimestamps: string[] = snapshot.docs
      .map((d: any) => (d.data() as UserProblemProgress).solvedAt)
      .filter((ts: any): ts is string => typeof ts === "string" && ts.length > 0);

    return StreakService.calculateStreaks(solvedTimestamps, timezone, referenceDate);
  }

  async resetUserProgress(userId: string): Promise<{ deletedProblems: number; deletedDays: number }> {
    const problemsSnap = await this.db
      .collection("users")
      .doc(userId)
      .collection("progress")
      .get();

    let deletedProblems = 0;
    for (const doc of problemsSnap.docs) {
      await this.db
        .collection("users")
        .doc(userId)
        .collection("progress")
        .doc(doc.id)
        .delete();
      deletedProblems++;
    }

    const daysSnap = await this.db
      .collection("users")
      .doc(userId)
      .collection("day_progress")
      .get();

    let deletedDays = 0;
    for (const doc of daysSnap.docs) {
      await this.db
        .collection("users")
        .doc(userId)
        .collection("day_progress")
        .doc(doc.id)
        .delete();
      deletedDays++;
    }

    return { deletedProblems, deletedDays };
  }
}

