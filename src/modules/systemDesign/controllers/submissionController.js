const { ok, created } = require("../../../utils/apiResponse");
const submissionService = require("../services/submissionService");
const { submitAnswerSchema } = require("../validators");
const logger = require("../../../utils/logger");

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  return { page, limit };
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/system-design/:id/submit
 * Authenticated. Submits a written design answer for a question.
 *
 * Body: { answerText: string }
 */
const submitAnswer = async (req, res, next) => {
  try {
    const parsed = submitAnswerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.errors,
      });
    }

    const submission = await submissionService.submitAnswer({
      questionId: req.params.id,
      userId: req.user.id,
      answerText: parsed.data.answerText,
    });

    logger.info(
      `[SystemDesign] Answer submitted: question ${req.params.id}, submission ${submission.id}, user ${req.user.id}`
    );
    return created(res, "Answer submitted successfully", { submission });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/system-design/submissions/me
 * Authenticated. Returns the current user's submissions, paginated.
 *
 * Query params:
 *   page   (default 1)
 *   limit  (default 10, max 100)
 */
const getMySubmissions = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);

    const result = await submissionService.getUserSubmissions({
      userId: req.user.id,
      page,
      limit,
    });

    return ok(res, "Submissions fetched successfully", result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/system-design/submissions/:submissionId
 * Authenticated. Returns a single submission.
 * Only the owner or an ADMIN may view it.
 */
const getSubmissionById = async (req, res, next) => {
  try {
    const submission = await submissionService.getSubmissionById({
      submissionId: req.params.submissionId,
      requestingUserId: req.user.id,
      isAdmin: req.user.role === "ADMIN",
    });

    return ok(res, "Submission fetched successfully", { submission });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitAnswer, getMySubmissions, getSubmissionById };
