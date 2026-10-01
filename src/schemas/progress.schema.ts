import { z } from "zod";

export const ProblemStatusSchema = z.enum(["not_started", "started", "solved", "revisit"]);

export const UpdateProblemProgressSchema = z.object({
  userId: z.string().min(1),
  problemId: z.string().min(1),
  status: ProblemStatusSchema,
  solvedAt: z.string().nullable().optional(),
  attemptsCount: z.number().int().min(0).optional(),
  personalTimeSeconds: z.number().int().min(0).nullable().optional(),
  personalNote: z.string().nullable().optional(),
});

export const BookmarkToggleSchema = z.object({
  userId: z.string().min(1),
  itemType: z.enum(["problem", "day", "library_page"]),
  itemId: z.string().min(1),
  label: z.string().nullable().optional(),
});

