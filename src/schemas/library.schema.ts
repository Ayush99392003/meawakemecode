import { z } from "zod";

export const LibrarySectionSchema = z.enum([
  "dsa",
  "os",
  "dbms",
  "cn",
  "oop",
  "system_design",
]);

export const InterviewQuestionSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

export const LibraryPageInputSchema = z.object({
  slug: z.string().min(1),
  section: LibrarySectionSchema,
  title: z.string().min(1),
  orderIndex: z.number().int().min(1),
  tags: z.array(z.string()).default([]),
  readTimeMinutes: z.number().int().min(1),
  content: z.string().min(1),
  interviewQuestions: z.array(InterviewQuestionSchema).default([]),
});

