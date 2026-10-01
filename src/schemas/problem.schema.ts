import { z } from "zod";

export const CF_EXTERNAL_ID_REGEX = /^\d+[A-Z]\d*$/;

export const BaseProblemSchema = z.object({
  id: z.string().min(1),
  platform: z.enum(["LC", "CF"]),
  externalId: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  difficulty: z.string().min(1),
  tags: z.array(z.string()).default([]),
  hint: z.string().nullable().default(null),
  expectedTimeComplexity: z.string().nullable().default(null),
  expectedSpaceComplexity: z.string().nullable().default(null),
  expectedPattern: z.string().nullable().default(null),
  status: z.enum(["active", "broken_link", "archived"]).default("active"),
});

export const ProblemInputSchema = BaseProblemSchema.refine(
  (data) => {
    if (data.platform === "CF") {
      return CF_EXTERNAL_ID_REGEX.test(data.externalId);
    }
    return true;
  },
  {
    message: "Codeforces externalId must match contestId + problemIndex (e.g. 1850A, 71A)",
    path: ["externalId"],
  }
);

export const ProblemUpdateSchema = BaseProblemSchema.partial().omit({ id: true });
