const { Router } = require("express");
const authMiddleware = require("../../../middlewares/authMiddleware");
const { requireRole } = require("../../../middlewares/roleMiddleware");

const {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} = require("../controllers/questionController");

const { submitAnswer, getMySubmissions, getSubmissionById } = require("../controllers/submissionController");

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Route ordering matters in Express.
//
// Static multi-segment paths  (/submissions/me, /submissions/:id)  must be
// registered BEFORE single-segment dynamic paths (/:id) to prevent Express
// from treating "submissions" as an :id value.
//
// Within the submission sub-paths, /submissions/me must come BEFORE
// /submissions/:submissionId so "me" is never captured as a submissionId.
// ─────────────────────────────────────────────────────────────────────────────

// ── Submission routes (registered first — static paths take priority) ─────────

/**
 * GET /api/system-design/submissions/me
 * Returns the authenticated user's own submissions (paginated).
 * Query: page, limit
 */
router.get("/submissions/me", authMiddleware, getMySubmissions);

/**
 * GET /api/system-design/submissions/:submissionId
 * Returns a single submission. Owner or ADMIN access only.
 */
router.get("/submissions/:submissionId", authMiddleware, getSubmissionById);

// ── Question routes ───────────────────────────────────────────────────────────

/**
 * GET /api/system-design
 * Returns paginated list of questions (solution excluded).
 * Query: page, limit, difficulty, search
 */
router.get("/", authMiddleware, getAllQuestions);

/**
 * GET /api/system-design/:id
 * Returns a single question with the full solution + hints.
 */
router.get("/:id", authMiddleware, getQuestionById);

/**
 * POST /api/system-design
 * Admin only. Creates a new system design question.
 */
router.post("/", authMiddleware, requireRole("ADMIN"), createQuestion);

/**
 * PUT /api/system-design/:id
 * Admin only. Partially updates a question.
 */
router.put("/:id", authMiddleware, requireRole("ADMIN"), updateQuestion);

/**
 * DELETE /api/system-design/:id
 * Admin only. Deletes a question and all its submissions.
 */
router.delete("/:id", authMiddleware, requireRole("ADMIN"), deleteQuestion);

/**
 * POST /api/system-design/:id/submit
 * Authenticated. Submits a written answer for a question.
 */
router.post("/:id/submit", authMiddleware, submitAnswer);

module.exports = router;
