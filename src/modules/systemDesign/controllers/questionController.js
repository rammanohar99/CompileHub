const { ok, created } = require("../../../utils/apiResponse");
const questionService = require("../services/questionService");
const { createQuestionSchema, updateQuestionSchema } = require("../validators");
const logger = require("../../../utils/logger");

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parses and clamps pagination query params into safe integers.
 * Protects against NaN, negative values, and oversized page sizes.
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  return { page, limit };
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/system-design
 * Returns paginated questions. Solution & hints are excluded from this list.
 *
 * Query params:
 *   page       (default 1)
 *   limit      (default 10, max 100)
 *   difficulty EASY | MEDIUM | HARD
 *   search     full-text search on title / description
 */
const getAllQuestions = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { difficulty, search } = req.query;

    // Validate difficulty if provided
    const validDifficulties = ["EASY", "MEDIUM", "HARD"];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: `Invalid difficulty. Must be one of: ${validDifficulties.join(", ")}`,
      });
    }

    const result = await questionService.getAllQuestions({ page, limit, difficulty, search });

    logger.info(`[SystemDesign] Listed questions — page ${page}, total ${result.total}`);
    return ok(res, "Questions fetched successfully", result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/system-design/:id
 * Returns a single question with the full solution, hints, and all fields.
 */
const getQuestionById = async (req, res, next) => {
  try {
    const question = await questionService.getQuestionById(req.params.id);
    return ok(res, "Question fetched successfully", { question });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/system-design
 * Admin-only. Creates a new system design question.
 *
 * Body: { title, difficulty, description, requirements, constraints, hints, solution }
 */
const createQuestion = async (req, res, next) => {
  try {
    const parsed = createQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.errors,
      });
    }

    const question = await questionService.createQuestion(parsed.data);

    logger.info(`[SystemDesign] Question created: ${question.id} by user ${req.user.id}`);
    return created(res, "Question created successfully", { question });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/system-design/:id
 * Admin-only. Partially updates a question (only provided fields are changed).
 *
 * Body: any subset of the question fields
 */
const updateQuestion = async (req, res, next) => {
  try {
    const parsed = updateQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.errors,
      });
    }

    const question = await questionService.updateQuestion(req.params.id, parsed.data);

    logger.info(`[SystemDesign] Question updated: ${req.params.id} by user ${req.user.id}`);
    return ok(res, "Question updated successfully", { question });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/system-design/:id
 * Admin-only. Deletes a question and all its submissions.
 */
const deleteQuestion = async (req, res, next) => {
  try {
    await questionService.deleteQuestion(req.params.id);

    logger.info(`[SystemDesign] Question deleted: ${req.params.id} by user ${req.user.id}`);
    return ok(res, "Question deleted successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion };
