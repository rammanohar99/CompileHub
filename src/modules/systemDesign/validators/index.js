const { z } = require("zod");

// ── Solution sub-schema ───────────────────────────────────────────────────────
// Stored as JSON in Postgres. Shape is enforced at the application layer here.

const solutionSchema = z.object({
  overview: z.string().min(10, "Solution overview must be at least 10 characters"),

  // Ordered list of architectural decisions / steps
  steps: z.array(z.string().min(1, "Each step must be a non-empty string")).min(1, "At least one step is required"),

  // Trade-offs discussed (consistency vs availability, SQL vs NoSQL, etc.)
  tradeoffs: z.array(z.string().min(1)).default([]),

  // Reserved for the future diagram builder — accepts any JSON shape
  diagram: z.record(z.unknown()).nullable().default(null),
});

// ── Question schemas ──────────────────────────────────────────────────────────

const createQuestionSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters"),

  // Match Prisma's Difficulty enum casing
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"], {
    errorMap: () => ({ message: 'Difficulty must be "EASY", "MEDIUM", or "HARD"' }),
  }),

  description: z.string().min(20, "Description must be at least 20 characters"),

  requirements: z
    .array(z.string().min(1, "Each requirement must be a non-empty string"))
    .min(1, "At least one functional requirement is needed"),

  constraints: z.array(z.string().min(1)).default([]),

  hints: z.array(z.string().min(1)).default([]),

  solution: solutionSchema,
});

// PATCH / PUT — every field optional, at least one must be provided
const updateQuestionSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    description: z.string().min(20).optional(),
    requirements: z.array(z.string().min(1)).min(1).optional(),
    constraints: z.array(z.string().min(1)).optional(),
    hints: z.array(z.string().min(1)).optional(),
    solution: solutionSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// ── Submission schema ─────────────────────────────────────────────────────────

const submitAnswerSchema = z.object({
  answerText: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(50_000, "Answer cannot exceed 50,000 characters"),
});

module.exports = { createQuestionSchema, updateQuestionSchema, submitAnswerSchema };
