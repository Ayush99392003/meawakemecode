import { z } from "zod";

export const DayInputSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().min(1).max(30),
  theme: z.string().min(1),
  summary: z.string().min(1),
  theoryContent: z.string().min(1),
  strictOrder: z.number().int().min(1).max(30),
  problemIds: z.array(z.string()).length(5, "Each day must have exactly 5 problems (3 LC + 2 CF)"),
});

export const DayUpdateSchema = DayInputSchema.partial().omit({ id: true });

