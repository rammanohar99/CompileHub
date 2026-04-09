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

const {
  submitAnswer,
  getMySubmissions,
  getMyQuestionSubmissions,
  getSubmissionById,
} = require("../controllers/submissionController");

const { getComments, postComment, toggleLike, deleteComment } = require("../controllers/commentController");
const { getCanvas, saveCanvas } = require("../controllers/canvasController");

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Route ordering matters in Express.
//
// Static multi-segment paths MUST be registered before single-segment dynamic
// paths (/:id) to prevent Express from treating a static segment as an :id.
//
// Order:
//   1. /submissions/me              (GET)
//   2. /submissions/:submissionId   (GET)
//   3. /comments/:commentId/like    (POST)  — 3 segments, before /:id
//   4. /comments/:commentId         (DELETE)— must precede /:id (DELETE)
//   5. /                            (GET, POST admin)
//   6. /:id                         (GET, PUT admin, DELETE admin)
//   7. /:id/submit                  (POST)
//   8. /:questionId/submissions/me  (GET)
//   9. /:questionId/comments        (GET, POST)
//  10. /:questionId/canvas          (GET, PUT)
// ─────────────────────────────────────────────────────────────────────────────

// ── 1-2. Global submission list ───────────────────────────────────────────────

router.get("/submissions/me",             authMiddleware, getMySubmissions);
router.get("/submissions/:submissionId",  authMiddleware, getSubmissionById);

// ── 3-4. Comment actions (no questionId prefix) ───────────────────────────────

router.post("/comments/:commentId/like",  authMiddleware, toggleLike);
router.delete("/comments/:commentId",     authMiddleware, deleteComment);

// ── 5. Question list / create ─────────────────────────────────────────────────

router.get("/",  authMiddleware, getAllQuestions);
router.post("/", authMiddleware, requireRole("ADMIN"), createQuestion);

// ── 6. Question detail / update / delete ──────────────────────────────────────

router.get("/:id",    authMiddleware, getQuestionById);
router.put("/:id",    authMiddleware, requireRole("ADMIN"), updateQuestion);
router.delete("/:id", authMiddleware, requireRole("ADMIN"), deleteQuestion);

// ── 7. Submit answer ──────────────────────────────────────────────────────────

router.post("/:id/submit", authMiddleware, submitAnswer);

// ── 8. Question-scoped submission history ─────────────────────────────────────

router.get("/:questionId/submissions/me", authMiddleware, getMyQuestionSubmissions);

// ── 9. Discussion comments ────────────────────────────────────────────────────

router.get("/:questionId/comments",  authMiddleware, getComments);
router.post("/:questionId/comments", authMiddleware, postComment);

// ── 10. Canvas state ──────────────────────────────────────────────────────────

router.get("/:questionId/canvas", authMiddleware, getCanvas);
router.put("/:questionId/canvas", authMiddleware, saveCanvas);

module.exports = router;
