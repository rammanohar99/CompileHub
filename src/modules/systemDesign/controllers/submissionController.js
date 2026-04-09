const { ok, created, badRequest } = require("../../../utils/apiResponse");
const submissionService = require("../services/submissionService");
const { submitAnswerSchema } = require("../validators");
const logger = require("../../../utils/logger");

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePagination(query, defaultLimit = 10) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || defaultLimit));
  return { page, limit };
}

/** "2h ago", "3d ago", etc. */
function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 2592000) return `${Math.floor(secs / 86400)}d ago`;
  return `${Math.floor(secs / 2592000)}mo ago`;
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /system-design/:id/submit
 * Authenticated. Submits a written design answer for a question.
 * Response includes xpAwarded + newTotal.
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

    const { submission, xpAwarded, newTotal } = await submissionService.submitAnswer({
      questionId: req.params.id,
      userId: req.user.id,
      answerText: parsed.data.answerText,
    });

    logger.info(
      `[SystemDesign] Answer submitted: question ${req.params.id}, submission ${submission.id}, user ${req.user.id}`
    );
    return created(res, "Answer submitted successfully", { submission, xpAwarded, newTotal });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /system-design/submissions/me
 * Authenticated. Returns the current user's submissions (all questions), paginated.
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
 * GET /system-design/:questionId/submissions/me
 * Authenticated. Returns the current user's submissions for a specific question, paginated.
 */
const getMyQuestionSubmissions = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { questionId } = req.params;

    const raw = await submissionService.getQuestionSubmissions({
      questionId,
      userId: req.user.id,
      page,
      limit,
    });

    // Decorate with computed fields
    const submissions = raw.submissions.map((s) => ({
      id: s.id,
      answerText: s.answerText,
      wordCount: s.answerText.trim().split(/\s+/).filter(Boolean).length,
      createdAt: s.createdAt,
      timeAgo: timeAgo(s.createdAt),
    }));

    return ok(res, "Submissions fetched successfully", {
      submissions,
      total: raw.total,
      page: raw.page,
      totalPages: raw.totalPages,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /system-design/submissions/:submissionId
 * Authenticated. Returns a single submission. Owner or ADMIN access only.
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

module.exports = { submitAnswer, getMySubmissions, getMyQuestionSubmissions, getSubmissionById };
