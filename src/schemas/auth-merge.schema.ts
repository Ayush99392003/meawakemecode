import { z } from "zod";
import { ProblemStatusSchema } from "./progress.schema.js";

export const GuestProgressItemSchema = z.object({
  problemId: z.string().min(1),
  status: ProblemStatusSchema,
  solvedAt: z.string().nullable().optional(),
  attemptsCount: z.number().int().min(0).default(0),
  personalTimeSeconds: z.number().int().min(0).nullable().optional(),
  personalNote: z.string().nullable().optional(),
  updatedAt: z.string(),
});

export const GuestBookmarkItemSchema = z.object({
  itemType: z.enum(["problem", "day", "library_page"]),
  itemId: z.string().min(1),
  label: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const GuestMCQAttemptItemSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.enum(["A", "B", "C", "D"]),
  isCorrect: z.boolean(),
  attemptedAt: z.string(),
});

export const GuestDayProgressItemSchema = z.object({
  dayId: z.string().min(1),
  completedAt: z.string(),
});

export const GuestMergePayloadSchema = z.object({
  progress: z.array(GuestProgressItemSchema).default([]),
  bookmarks: z.array(GuestBookmarkItemSchema).default([]),
  mcqAttempts: z.array(GuestMCQAttemptItemSchema).default([]),
  dayProgress: z.array(GuestDayProgressItemSchema).default([]),
});

