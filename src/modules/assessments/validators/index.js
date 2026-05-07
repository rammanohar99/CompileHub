const { z } = require("zod");

const idSchema = z.string().min(1);

const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional().nullable(),
  icon: z.string().max(255).optional().nullable(),
  isActive: z.boolean().optional(),
});

const topicSchema = z.object({
  categoryId: idSchema,
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

const questionTypeEnum = z.enum(["MCQ", "MULTI_SELECT", "TRUE_FALSE", "CODE_OUTPUT", "SCENARIO_BASED"]);
const difficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);
const reviewStatusEnum = z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"]);
const csvDifficultySchema = z.string().regex(/^(EASY|MEDIUM|HARD)(,(EASY|MEDIUM|HARD))*$/);
const csvQuestionTypeSchema = z
  .string()
  .regex(/^(MCQ|MULTI_SELECT|TRUE_FALSE|CODE_OUTPUT|SCENARIO_BASED)(,(MCQ|MULTI_SELECT|TRUE_FALSE|CODE_OUTPUT|SCENARIO_BASED))*$/);

const baseQuestionSchema = z.object({
  categoryId: idSchema,
  topicId: idSchema.optional().nullable(),
  difficulty: difficultyEnum,
  question: z.string().min(10),
  explanation: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string().min(1)).default([]),
  isActive: z.boolean().optional(),
  estimatedTimeSeconds: z.number().int().min(5).max(3600).optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
  reviewStatus: reviewStatusEnum.optional(),
});

const mcqQuestionSchema = baseQuestionSchema.extend({
  questionType: z.literal("MCQ"),
  options: z.array(z.string().min(1)).min(2),
  correctAnswer: z.string().min(1),
});

const multiSelectQuestionSchema = baseQuestionSchema.extend({
  questionType: z.literal("MULTI_SELECT"),
  options: z.array(z.string().min(1)).min(2),
  correctAnswer: z.array(z.string().min(1)).min(1),
});

const trueFalseQuestionSchema = baseQuestionSchema.extend({
  questionType: z.literal("TRUE_FALSE"),
  options: z.tuple([z.literal("true"), z.literal("false")]).optional(),
  correctAnswer: z.boolean(),
});

const codeOutputQuestionSchema = baseQuestionSchema.extend({
  questionType: z.literal("CODE_OUTPUT"),
  options: z.array(z.string().min(1)).min(2).optional().nullable(),
  correctAnswer: z.string().min(1),
});

const scenarioQuestionSchema = baseQuestionSchema.extend({
  questionType: z.literal("SCENARIO_BASED"),
  options: z.array(z.string().min(1)).min(2),
  correctAnswer: z.string().min(1),
});

const questionSchema = z.discriminatedUnion("questionType", [
  mcqQuestionSchema,
  multiSelectQuestionSchema,
  trueFalseQuestionSchema,
  codeOutputQuestionSchema,
  scenarioQuestionSchema,
]);

const updateQuestionSchema = z
  .object({
    categoryId: idSchema.optional(),
    topicId: idSchema.optional().nullable(),
    questionType: questionTypeEnum.optional(),
    difficulty: difficultyEnum.optional(),
    question: z.string().min(10).optional(),
    options: z.union([z.array(z.string().min(1)).min(2), z.tuple([z.literal("true"), z.literal("false")]), z.null()]).optional(),
    correctAnswer: z.union([z.string().min(1), z.boolean(), z.array(z.string().min(1)).min(1)]).optional(),
    explanation: z.string().max(5000).optional().nullable(),
    tags: z.array(z.string().min(1)).optional(),
    isActive: z.boolean().optional(),
    estimatedTimeSeconds: z.number().int().min(5).max(3600).optional(),
    metadata: z.record(z.unknown()).optional().nullable(),
    reviewStatus: reviewStatusEnum.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const bulkQuestionsSchema = z.object({
  questions: z.array(questionSchema).min(1).max(500),
});

const generateAssessmentSchema = z.object({
  title: z.string().max(120).optional(),
  categoryId: idSchema.optional().nullable(),
  topics: z.array(idSchema).optional().default([]),
  difficulty: z.union([difficultyEnum, z.array(difficultyEnum).min(1)]).optional(),
  questionCount: z.number().int().min(1).max(200),
  questionTypes: z
    .array(questionTypeEnum)
    .min(1)
    .optional()
    .default(["MCQ", "MULTI_SELECT", "TRUE_FALSE", "CODE_OUTPUT", "SCENARIO_BASED"]),
  timedMode: z.boolean().default(false),
});

const startAttemptSchema = z.object({
  assessmentId: idSchema,
});

const saveAnswerSchema = z.object({
  questionId: idSchema,
  selectedAnswer: z.union([z.string(), z.boolean(), z.array(z.string().min(1)), z.null()]).optional(),
  selectedOption: z.union([z.string(), z.boolean(), z.null()]).optional(),
  selectedOptions: z.array(z.string().min(1)).optional(),
  answer: z.union([z.string(), z.boolean(), z.array(z.string().min(1)), z.null()]).optional(),
  value: z.union([z.string(), z.boolean(), z.array(z.string().min(1)), z.null()]).optional(),
  markedForReview: z.boolean().optional(),
  confidenceLevel: z.number().int().min(1).max(5).optional().nullable(),
  timeSpentSeconds: z.number().int().min(0).max(7200).optional(),
  isFinal: z.boolean().optional(),
}).transform((data) => ({
  ...data,
  selectedAnswer:
    data.selectedAnswer ??
    data.selectedOption ??
    data.selectedOptions ??
    data.answer ??
    data.value,
}));

const saveProgressSchema = z.object({
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const finishAttemptSchema = z.object({
  force: z.boolean().optional().default(false),
});

const bookmarkSchema = z.object({
  questionId: idSchema,
});

const deactivateQuestionsSchema = z.object({
  questionIds: z.array(idSchema).min(1).max(500),
  isActive: z.boolean().default(false),
});

const reviewStatusSchema = z.object({
  reviewStatus: reviewStatusEnum,
});

const listQuestionsQuerySchema = z.object({
  categoryId: idSchema.optional(),
  topicId: idSchema.optional(),
  difficulty: z.union([difficultyEnum, csvDifficultySchema]).optional(),
  questionType: z.union([questionTypeEnum, csvQuestionTypeSchema]).optional(),
  questionTypes: csvQuestionTypeSchema.optional(),
  tags: z.string().optional(),
  search: z.string().max(500).optional(),
  active: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "difficulty"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const categoriesQuerySchema = z.object({
  includeInactive: z.enum(["true", "false"]).optional(),
});

const topicsQuerySchema = z.object({
  includeInactive: z.enum(["true", "false"]).optional(),
});

module.exports = {
  categorySchema,
  topicSchema,
  questionSchema,
  updateQuestionSchema,
  bulkQuestionsSchema,
  generateAssessmentSchema,
  startAttemptSchema,
  saveAnswerSchema,
  saveProgressSchema,
  finishAttemptSchema,
  bookmarkSchema,
  deactivateQuestionsSchema,
  reviewStatusSchema,
  listQuestionsQuerySchema,
  listQuerySchema,
  categoriesQuerySchema,
  topicsQuerySchema,
};
