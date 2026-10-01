import { z } from "zod";

export const MCQOptionKeySchema = z.enum(["A", "B", "C", "D"]);

export const MCQOptionSchema = z.object({
  key: MCQOptionKeySchema,
  text: z.string().min(1),
});

export const DayQuestionInputSchema = z.object({
  id: z.string().min(1),
  dayId: z.string().min(1),
  topic: z.string().min(1),
  question: z.string().min(1),
  codeSnippet: z.string().nullable().default(null),
  options: z.array(MCQOptionSchema).length(4, "Each question must have 4 options (A, B, C, D)"),
  correctOption: MCQOptionKeySchema,
  detailedExplanation: z.string().min(10, "Detailed explanation must provide clear rationale and trap analysis"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  orderIndex: z.number().int().min(1),
});

export const MCQSubmissionSchema = z.object({
  userId: z.string().min(1),
  questionId: z.string().min(1),
  selectedOption: MCQOptionKeySchema,
});

