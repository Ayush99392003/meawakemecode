import { describe, it, expect, beforeEach } from "vitest";
import { MockFirestore } from "../src/testing/mock-firestore.js";
import { MCQService } from "../src/services/mcq.service.js";

describe("Component 4: MCQ Assessment Engine with Solutions", () => {
  let mockDb: MockFirestore;
  let mcqService: MCQService;

  beforeEach(() => {
    mockDb = new MockFirestore();
    mcqService = new MCQService(mockDb as any);
  });

  const sampleQuestion = {
    id: "mcq_day1_1",
    dayId: "day_1",
    topic: "Hash Map Collisions & Complexity",
    question:
      "In C++, what is the worst-case time complexity of inserting N elements into std::unordered_map if all keys hash to the same bucket?",
    codeSnippet: "std::unordered_map<int, int> mp;\nfor(int i = 0; i < n; i++) mp[i] = i;",
    options: [
      { key: "A" as const, text: "O(1)" },
      { key: "B" as const, text: "O(log N)" },
      { key: "C" as const, text: "O(N^2) total (O(N) per insertion)" },
      { key: "D" as const, text: "O(N log N)" },
    ],
    correctOption: "C" as const,
    detailedExplanation:
      "Correct Answer: C. When every key hashes to the same bucket in std::unordered_map, the bucket behaves like a linked list (or linear probe chain). Each insertion must traverse the entire existing chain to check for duplicate keys, taking O(k) for the k-th insertion. Summing 1 + 2 + ... + N results in O(N^2) total time. On Codeforces, anti-hash tests specifically exploit this to cause Time Limit Exceeded (TLE) unless custom randomized hashers like custom_hash with splitmix64 are used.",
    difficulty: "medium" as const,
    orderIndex: 1,
  };

  it("should create an MCQ question with detailed solution explanation", async () => {
    const q = await mcqService.createQuestion(sampleQuestion);
    expect(q.id).toBe("mcq_day1_1");
    expect(q.correctOption).toBe("C");
    expect(q.detailedExplanation).toContain("anti-hash tests");
  });

  it("should strip correctOption and detailedExplanation for public consumption prior to submission", async () => {
    await mcqService.createQuestion(sampleQuestion);

    const publicQuestions = await mcqService.getQuestionsForDayPublic("day_1");
    expect(publicQuestions).toHaveLength(1);

    const q = publicQuestions[0];
    expect(q.id).toBe("mcq_day1_1");
    expect(q.question).toBe(sampleQuestion.question);
    expect(q.options).toHaveLength(4);

    // CRITICAL: Ensure answers are never leaked over public endpoints
    expect((q as any).correctOption).toBeUndefined();
    expect((q as any).detailedExplanation).toBeUndefined();
  });

  it("should evaluate a correct submission and return the full solution and explanation", async () => {
    await mcqService.createQuestion(sampleQuestion);

    const result = await mcqService.submitAnswer({
      userId: "user_test_123",
      questionId: "mcq_day1_1",
      selectedOption: "C",
    });

    expect(result.isCorrect).toBe(true);
    expect(result.selectedOption).toBe("C");
    expect(result.correctOption).toBe("C");
    expect(result.detailedExplanation).toContain("Summing 1 + 2 + ... + N results in O(N^2)");
  });

  it("should evaluate an incorrect submission and guide the user with the correct answer and trap explanation", async () => {
    await mcqService.createQuestion(sampleQuestion);

    const result = await mcqService.submitAnswer({
      userId: "user_test_123",
      questionId: "mcq_day1_1",
      selectedOption: "A", // Chose average-case O(1) by mistake
    });

    expect(result.isCorrect).toBe(false);
    expect(result.selectedOption).toBe("A");
    expect(result.correctOption).toBe("C");
    expect(result.detailedExplanation).toBeDefined();
  });

  it("should calculate user quiz summary for a day accurately", async () => {
    await mcqService.createQuestion(sampleQuestion);
    await mcqService.createQuestion({
      ...sampleQuestion,
      id: "mcq_day1_2",
      question: "Which data structure provides O(1) amortized insertion and O(1) lookup?",
      correctOption: "B",
      detailedExplanation: "A Hash Table provides O(1) average/amortized operations.",
      orderIndex: 2,
    });

    // Submit question 1 correctly
    await mcqService.submitAnswer({
      userId: "user_score_test",
      questionId: "mcq_day1_1",
      selectedOption: "C",
    });

    // Submit question 2 incorrectly
    await mcqService.submitAnswer({
      userId: "user_score_test",
      questionId: "mcq_day1_2",
      selectedOption: "A",
    });

    const summary = await mcqService.getUserDayQuizSummary("user_score_test", "day_1");
    expect(summary.totalQuestions).toBe(2);
    expect(summary.attempted).toBe(2);
    expect(summary.correct).toBe(1);
    expect(summary.scorePercentage).toBe(50);
  });
});

