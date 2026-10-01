import { Day } from "../types/index.js";
import { DayInputSchema } from "../schemas/curriculum.schema.js";
import { getFirestoreDb } from "../db/firestore.js";

export type DayAccessStatus = "locked" | "unlocked" | "completed" | "in_progress";

export class CurriculumService {
  private collectionName = "days";

  constructor(private db: any = getFirestoreDb()) {}

  async createDay(input: unknown): Promise<Day> {
    const validated = DayInputSchema.parse(input);
    const dayRef = this.db.collection(this.collectionName).doc(validated.id);

    const doc = await dayRef.get();
    if (doc.exists) {
      throw new Error(`Day with ID '${validated.id}' already exists.`);
    }

    await dayRef.set(validated);
    return validated;
  }

  async getDayByNumber(dayNumber: number): Promise<Day | null> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where("number", "==", dayNumber)
      .get();

    if (snapshot.empty) {
      return null;
    }
    return snapshot.docs[0].data() as Day;
  }

  async getAllDays(): Promise<Day[]> {
    const snapshot = await this.db.collection(this.collectionName).get();
    const days = snapshot.docs.map((d: any) => d.data() as Day);
    return days.sort((a: Day, b: Day) => a.number - b.number);
  }

  async batchUpsertDays(days: unknown[]): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const raw of days) {
      const validated = DayInputSchema.parse(raw);
      const docRef = this.db.collection(this.collectionName).doc(validated.id);
      const existing = await docRef.get();

      if (existing.exists) {
        await docRef.set(validated, { merge: true });
        updated++;
      } else {
        await docRef.set(validated);
        inserted++;
      }
    }

    return { inserted, updated };
  }

  /**
   * Evaluates if a given day is locked, unlocked, or completed based on strict mode and user history.
   */
  evaluateDayStatus(
    dayNumber: number,
    completedDayNumbers: Set<number>,
    problemsSolvedForDay: number,
    totalProblemsForDay: number = 5,
    strictMode: boolean = false
  ): DayAccessStatus {
    const isCompleted =
      completedDayNumbers.has(dayNumber) || problemsSolvedForDay >= totalProblemsForDay;

    if (isCompleted) {
      return "completed";
    }

    if (problemsSolvedForDay > 0) {
      return "in_progress";
    }

    if (!strictMode || dayNumber === 1) {
      return "unlocked";
    }

    // In strict mode, Day N is locked unless Day N-1 is complete
    const isPreviousDayComplete = completedDayNumbers.has(dayNumber - 1);
    return isPreviousDayComplete ? "unlocked" : "locked";
  }

  /**
   * "Continue where you left off" logic: Finds the first incomplete day.
   */
  findFirstIncompleteDay(completedDayNumbers: Set<number>, totalDays: number = 30): number {
    for (let day = 1; day <= totalDays; day++) {
      if (!completedDayNumbers.has(day)) {
        return day;
      }
    }
    return totalDays;
  }
}

