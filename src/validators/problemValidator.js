const { z } = require("zod");

const createProblemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  companies: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

const addTestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean().optional().default(false),
});

const addTestCasesSchema = z.object({
  testCases: z.array(addTestCaseSchema).min(1, "At least one test case is required"),
});

module.exports = { createProblemSchema, addTestCasesSchema };
