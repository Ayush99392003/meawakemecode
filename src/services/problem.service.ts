import { Problem } from "../types/index.js";
import { ProblemInputSchema, ProblemUpdateSchema } from "../schemas/problem.schema.js";
import { getFirestoreDb } from "../db/firestore.js";

export class ProblemService {
  private collectionName = "problems";

  constructor(private db: any = getFirestoreDb()) {}

  async createProblem(input: unknown): Promise<Problem> {
    const validated = ProblemInputSchema.parse(input);
    const problemRef = this.db.collection(this.collectionName).doc(validated.id);

    const doc = await problemRef.get();
    if (doc.exists) {
      throw new Error(`Problem with ID '${validated.id}' already exists.`);
    }

    const problemData: Problem = {
      ...validated,
      lastCheckedAt: new Date().toISOString(),
    };

    await problemRef.set(problemData);
    return problemData;
  }

  async getProblemById(id: string): Promise<Problem | null> {
    const doc = await this.db.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as Problem;
  }

  async updateProblem(id: string, updates: unknown): Promise<Problem> {
    const validated = ProblemUpdateSchema.parse(updates);
    const problemRef = this.db.collection(this.collectionName).doc(id);

    const doc = await problemRef.get();
    if (!doc.exists) {
      throw new Error(`Problem with ID '${id}' not found.`);
    }

    const updatedData = {
      ...doc.data(),
      ...validated,
      lastCheckedAt: new Date().toISOString(),
    };

    await problemRef.set(updatedData, { merge: true });
    return updatedData as Problem;
  }

  async listProblems(filters?: {
    platform?: "LC" | "CF";
    difficulty?: string;
    tag?: string;
    status?: "active" | "broken_link" | "archived";
  }): Promise<Problem[]> {
    let query: any = this.db.collection(this.collectionName);

    if (filters?.platform) {
      query = query.where("platform", "==", filters.platform);
    }
    if (filters?.status) {
      query = query.where("status", "==", filters.status);
    }
    if (filters?.difficulty) {
      query = query.where("difficulty", "==", filters.difficulty);
    }
    if (filters?.tag) {
      query = query.where("tags", "array-contains", filters.tag);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((d: any) => d.data() as Problem);
  }

  async batchUpsert(problems: unknown[]): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const raw of problems) {
      const validated = ProblemInputSchema.parse(raw);
      const docRef = this.db.collection(this.collectionName).doc(validated.id);
      const existing = await docRef.get();

      if (existing.exists) {
        await docRef.set(
          {
            ...validated,
            lastCheckedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        updated++;
      } else {
        await docRef.set({
          ...validated,
          lastCheckedAt: new Date().toISOString(),
        });
        inserted++;
      }
    }

    return { inserted, updated };
  }
}

