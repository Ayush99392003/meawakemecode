import {
  DayQuestion,
  PublicDayQuestion,
  UserMCQAttempt,
  MCQOptionKey,
} from "../types/index.js";
import {
  DayQuestionInputSchema,
  MCQSubmissionSchema,
} from "../schemas/mcq.schema.js";
import { getFirestoreDb } from "../db/firestore.js";

export interface MCQSubmissionResult {
  questionId: string;
  selectedOption: MCQOptionKey;
  isCorrect: boolean;
  correctOption: MCQOptionKey;
  detailedExplanation: string;
  attemptedAt: string;
}

export interface UserDayQuizSummary {
  dayId: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  scorePercentage: number;
  attempts: UserMCQAttempt[];
}

export class MCQService {
  private collectionName = "day_questions";

  constructor(private db: any = getFirestoreDb()) {}

  async createQuestion(input: unknown): Promise<DayQuestion> {
    const validated = DayQuestionInputSchema.parse(input);
    const docRef = this.db.collection(this.collectionName).doc(validated.id);

    const doc = await docRef.get();
    if (doc.exists) {
      throw new Error(`Question with ID '${validated.id}' already exists.`);
    }

    await docRef.set(validated);
    return validated;
  }

  async batchUpsertQuestions(
    questions: unknown[]
  ): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const raw of questions) {
      const validated = DayQuestionInputSchema.parse(raw);
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
   * Returns questions for a day, stripped of the answers and detailed explanations
   * to guarantee zero-client-cheat before submission.
   */
  async getQuestionsForDayPublic(dayId: string): Promise<PublicDayQuestion[]> {
    const snapshot = await this.db
      .collection(this.collectionName)
      .where("dayId", "==", dayId)
      .get();

    const questions = snapshot.docs.map((doc: any) => {
      const data = doc.data() as DayQuestion;
      const { correctOption, detailedExplanation, ...publicFields } = data;
      return publicFields;
    });

    return questions.sort((a: PublicDayQuestion, b: PublicDayQuestion) => a.orderIndex - b.orderIndex);
  }

  async getQuestionById(questionId: string): Promise<DayQuestion | null> {
    const doc = await this.db.collection(this.collectionName).doc(questionId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as DayQuestion;
  }

  /**
   * Evaluates user selection, stores attempt in user subcollection,
   * and returns whether it's correct along with the detailed explanation and solution.
   */
  async submitAnswer(input: unknown): Promise<MCQSubmissionResult> {
    const { userId, questionId, selectedOption } = MCQSubmissionSchema.parse(input);

    const question = await this.getQuestionById(questionId);
    if (!question) {
      throw new Error(`Question '${questionId}' not found.`);
    }

    const isCorrect = selectedOption === question.correctOption;
    const attemptedAt = new Date().toISOString();

    const attempt: UserMCQAttempt = {
      id: questionId,
      userId,
      questionId,
      selectedOption,
      isCorrect,
      attemptedAt,
    };

    // Store in users/{userId}/mcq_attempts/{questionId}
    await this.db
      .collection("users")
      .doc(userId)
      .collection("mcq_attempts")
      .doc(questionId)
      .set(attempt);

    return {
      questionId,
      selectedOption,
      isCorrect,
      correctOption: question.correctOption,
      detailedExplanation: question.detailedExplanation,
      attemptedAt,
    };
  }

  /**
   * Computes the user's score summary for a specific day.
   */
  async getUserDayQuizSummary(userId: string, dayId: string): Promise<UserDayQuizSummary> {
    const questionsSnapshot = await this.db
      .collection(this.collectionName)
      .where("dayId", "==", dayId)
      .get();

    const totalQuestions = questionsSnapshot.docs.length;
    const questionIds = new Set(questionsSnapshot.docs.map((d: any) => d.id));

    const attemptsSnapshot = await this.db
      .collection("users")
      .doc(userId)
      .collection("mcq_attempts")
      .get();

    const attempts: UserMCQAttempt[] = attemptsSnapshot.docs
      .map((d: any) => d.data() as UserMCQAttempt)
      .filter((a: UserMCQAttempt) => questionIds.has(a.questionId));

    const correct = attempts.filter((a) => a.isCorrect).length;
    const scorePercentage =
      totalQuestions === 0 ? 0 : Math.round((correct / totalQuestions) * 100);

    return {
      dayId,
      totalQuestions,
      attempted: attempts.length,
      correct,
      scorePercentage,
      attempts,
    };
  }
}

