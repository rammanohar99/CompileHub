const { Router } = require("express");
const authMiddleware = require("../../../middlewares/authMiddleware");
const { requireRole } = require("../../../middlewares/roleMiddleware");
const { validate } = require("../../../middlewares/validateMiddleware");
const { validateQuery } = require("../middlewares/validateQuery");

const {
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
} = require("../validators");

const controller = require("../controllers/assessmentController");

const router = Router();

router.use(authMiddleware);

router.post("/categories", requireRole("ADMIN"), validate(categorySchema), controller.createCategory);
router.get("/categories", validateQuery(categoriesQuerySchema), controller.getCategories);
router.get("/categories/:id", controller.getCategory);
router.put("/categories/:id", requireRole("ADMIN"), validate(categorySchema.partial()), controller.updateCategory);
router.delete("/categories/:id", requireRole("ADMIN"), controller.deleteCategory);

router.post("/topics", requireRole("ADMIN"), validate(topicSchema), controller.createTopic);
router.get("/categories/:categoryId/topics", validateQuery(topicsQuerySchema), controller.getTopicsByCategory);
router.put("/topics/:id", requireRole("ADMIN"), validate(topicSchema.partial()), controller.updateTopic);
router.delete("/topics/:id", requireRole("ADMIN"), controller.deleteTopic);

router.post("/questions", requireRole("ADMIN"), validate(questionSchema), controller.createQuestion);
router.post("/questions/bulk", requireRole("ADMIN"), validate(bulkQuestionsSchema), controller.bulkCreateQuestions);
router.put("/questions/:id", requireRole("ADMIN"), validate(updateQuestionSchema), controller.updateQuestion);
router.delete("/questions/:id", requireRole("ADMIN"), controller.deleteQuestion);
router.get("/questions/:id", controller.getQuestionById);
router.get("/questions", validateQuery(listQuestionsQuerySchema), controller.searchQuestions);

router.post("/generate", validate(generateAssessmentSchema), controller.generateAssessment);

router.post("/attempts/start", validate(startAttemptSchema), controller.startAssessmentAttempt);
router.post("/attempts/:attemptId/answer", validate(saveAnswerSchema), controller.submitAnswer);
router.put("/attempts/:attemptId/progress", validate(saveProgressSchema), controller.saveProgress);
router.post("/attempts/:attemptId/finish", validate(finishAttemptSchema), controller.finishAttempt);
router.get("/attempts/:attemptId/result", controller.getAttemptResult);
router.get("/attempts/history", validateQuery(listQuerySchema), controller.getAttemptHistory);
router.get("/attempts/:attemptId", controller.getAttemptResult);

router.get("/analytics/attempts/:attemptId", controller.getAttemptAnalytics);
router.get("/analytics/summary", controller.getUserPerformanceSummary);

router.post("/bookmarks", validate(bookmarkSchema), controller.bookmarkQuestion);
router.delete("/bookmarks/:questionId", controller.removeBookmark);
router.get("/bookmarks", validateQuery(listQuerySchema), controller.getBookmarks);

router.post("/admin/questions/import", requireRole("ADMIN"), validate(bulkQuestionsSchema), controller.bulkImportQuestions);
router.get("/admin/questions/export", requireRole("ADMIN"), validateQuery(listQuestionsQuerySchema), controller.bulkExportQuestions);
router.patch(
  "/admin/questions/deactivate",
  requireRole("ADMIN"),
  validate(deactivateQuestionsSchema),
  controller.deactivateQuestions
);
router.patch(
  "/admin/questions/:id/review-status",
  requireRole("ADMIN"),
  validate(reviewStatusSchema),
  controller.updateQuestionReviewStatus
);

module.exports = router;
