const { ok, created, notFound } = require("../../../utils/apiResponse");
const service = require("../services/assessmentService");
const logger = require("../../../utils/logger");
const { sanitizeQuestion, sanitizeQuestionList } = require("../utils/sanitizers");

const withPaginationMeta = (result = {}) => {
  const pagination = result.pagination || {};
  return {
    total: pagination.total,
    page: pagination.page,
    limit: pagination.limit,
  };
};

const attachAttemptTiming = (attempt) => {
  if (!attempt) return attempt;
  const timedMode = !!attempt?.assessment?.config?.timedMode;
  const estimatedDurationSecs =
    attempt?.assessment?.estimatedDurationSecs ?? attempt?.assessment?.config?.estimatedDurationSecs ?? null;

  const endsAt =
    timedMode && estimatedDurationSecs && attempt.startedAt
      ? new Date(new Date(attempt.startedAt).getTime() + estimatedDurationSecs * 1000).toISOString()
      : null;

  return {
    ...attempt,
    timedMode,
    endsAt,
  };
};

const withNotFound = (entity) => {
  const err = new Error(`${entity} not found`);
  err.statusCode = 404;
  throw err;
};

const createCategory = async (req, res, next) => {
  try {
    const category = await service.createCategory(req.body);
    return created(res, "Assessment category created", { category });
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await service.listCategories({ includeInactive: req.query.includeInactive === "true" });
    return ok(res, "Assessment categories fetched", { categories });
  } catch (err) {
    next(err);
  }
};

const getCategory = async (req, res, next) => {
  try {
    const category = await service.getCategoryById(req.params.id);
    if (!category) return notFound(res, "Assessment category not found");
    return ok(res, "Assessment category fetched", { category });
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await service.updateCategory(req.params.id, req.body);
    return ok(res, "Assessment category updated", { category });
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    await service.softDeleteCategory(req.params.id);
    return ok(res, "Assessment category deleted", { deleted: true });
  } catch (err) {
    next(err);
  }
};

const createTopic = async (req, res, next) => {
  try {
    const topic = await service.createTopic(req.body);
    return created(res, "Assessment topic created", { topic });
  } catch (err) {
    next(err);
  }
};

const getTopicsByCategory = async (req, res, next) => {
  try {
    const topics = await service.listTopicsByCategory(req.params.categoryId, {
      includeInactive: req.query.includeInactive === "true",
    });
    return ok(res, "Assessment topics fetched", { topics });
  } catch (err) {
    next(err);
  }
};

const updateTopic = async (req, res, next) => {
  try {
    const topic = await service.updateTopic(req.params.id, req.body);
    return ok(res, "Assessment topic updated", { topic });
  } catch (err) {
    next(err);
  }
};

const deleteTopic = async (req, res, next) => {
  try {
    await service.deleteTopic(req.params.id);
    return ok(res, "Assessment topic deleted", { deleted: true });
  } catch (err) {
    next(err);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const question = await service.createQuestion(req.body, req.user.id);
    return created(res, "Assessment question created", { question });
  } catch (err) {
    next(err);
  }
};

const bulkCreateQuestions = async (req, res, next) => {
  try {
    const questions = await service.bulkCreateQuestions(req.body.questions, req.user.id);
    return created(res, "Assessment questions created", { count: questions.length, questions });
  } catch (err) {
    next(err);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const question = await service.updateQuestion(req.params.id, req.body);
    return ok(res, "Assessment question updated", { question });
  } catch (err) {
    next(err);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    await service.softDeleteQuestion(req.params.id);
    return ok(res, "Assessment question deleted", { deleted: true });
  } catch (err) {
    next(err);
  }
};

const getQuestionById = async (req, res, next) => {
  try {
    const question = await service.getQuestionById(req.params.id);
    if (!question) return notFound(res, "Assessment question not found");
    const isAdmin = req.user.role === "ADMIN";
    return ok(res, "Assessment question fetched", {
      question: sanitizeQuestion(question, { includeAnswerKey: isAdmin, includeInternal: isAdmin }),
    });
  } catch (err) {
    next(err);
  }
};

const searchQuestions = async (req, res, next) => {
  try {
    const result = await service.listQuestions(req.query);
    const isAdmin = req.user.role === "ADMIN";
    const meta = withPaginationMeta(result);
    const data = {
      ...result,
      questions: sanitizeQuestionList(result.questions, { includeAnswerKey: isAdmin, includeInternal: isAdmin }),
    };
    return ok(res, "Assessment questions fetched", {
      ...data,
    }, meta);
  } catch (err) {
    next(err);
  }
};

const generateAssessment = async (req, res, next) => {
  try {
    const result = await service.generateAssessment(req.body, req.user.id);
    return created(res, "Assessment generated", {
      ...result,
      questions: sanitizeQuestionList(result.questions, { includeAnswerKey: false, includeInternal: false }),
    });
  } catch (err) {
    logger.error(`[Assessments] Generation failed for user ${req.user?.id}: ${err.message}`);
    next(err);
  }
};

const startAssessmentAttempt = async (req, res, next) => {
  try {
    const attempt = await service.startAttempt(req.body.assessmentId, req.user.id);
    return created(res, "Assessment attempt started", { attempt: attachAttemptTiming(attempt) });
  } catch (err) {
    logger.error(`[Assessments] Attempt start failed for user ${req.user?.id}: ${err.message}`);
    next(err);
  }
};

const submitAnswer = async (req, res, next) => {
  try {
    const answer = await service.saveAnswer(req.params.attemptId, req.user.id, req.body);
    return ok(res, "Answer saved", { answer });
  } catch (err) {
    next(err);
  }
};

const saveProgress = async (req, res, next) => {
  try {
    const metadata = Object.prototype.hasOwnProperty.call(req.body, "metadata") ? req.body.metadata : req.body;
    const attempt = await service.saveProgress(req.params.attemptId, req.user.id, metadata || {});
    return ok(res, "Attempt progress saved", { attempt: attachAttemptTiming(attempt) });
  } catch (err) {
    next(err);
  }
};

const finishAttempt = async (req, res, next) => {
  try {
    const result = await service.finishAttempt(req.params.attemptId, req.user.id);
    return ok(res, "Assessment attempt finished", { result });
  } catch (err) {
    logger.error(`[Assessments] Attempt finish failed for user ${req.user?.id} attempt ${req.params.attemptId}: ${err.message}`);
    next(err);
  }
};

const getAttemptResult = async (req, res, next) => {
  try {
    const result = await service.getAttemptResult(req.params.attemptId, req.user.id);
    const isAdmin = req.user.role === "ADMIN";
    const canRevealAnswers = isAdmin || result.status === "COMPLETED";

    const safeResult = {
      ...result,
      assessment: {
        ...result.assessment,
        questions: result.assessment.questions.map((item) => ({
          ...item,
          question: sanitizeQuestion(item.question, {
            includeAnswerKey: canRevealAnswers,
            includeInternal: isAdmin,
          }),
        })),
      },
    };

    return ok(res, "Assessment attempt result fetched", { result: attachAttemptTiming(safeResult) });
  } catch (err) {
    next(err);
  }
};

const getAttemptHistory = async (req, res, next) => {
  try {
    const history = await service.listAttemptHistory(req.user.id, req.query);
    const meta = withPaginationMeta(history);
    return ok(
      res,
      "Assessment attempt history fetched",
      {
        ...history,
        attempts: history.attempts.map((attempt) => attachAttemptTiming(attempt)),
      },
      meta
    );
  } catch (err) {
    next(err);
  }
};

const getAttemptAnalytics = async (req, res, next) => {
  try {
    const analytics = await service.getAttemptAnalytics(req.params.attemptId, req.user.id);
    return ok(res, "Assessment analytics fetched", { analytics });
  } catch (err) {
    next(err);
  }
};

const getUserPerformanceSummary = async (req, res, next) => {
  try {
    const summary = await service.getUserPerformanceSummary(req.user.id);
    return ok(res, "User performance summary fetched", { summary });
  } catch (err) {
    next(err);
  }
};

const bookmarkQuestion = async (req, res, next) => {
  try {
    const bookmark = await service.addBookmark(req.user.id, req.body.questionId);
    return created(res, "Question bookmarked", { bookmark });
  } catch (err) {
    next(err);
  }
};

const removeBookmark = async (req, res, next) => {
  try {
    await service.removeBookmark(req.user.id, req.params.questionId);
    return ok(res, "Bookmark removed", { removed: true });
  } catch (err) {
    next(err);
  }
};

const getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await service.listBookmarks(req.user.id, req.query);
    const meta = withPaginationMeta(bookmarks);
    return ok(res, "Bookmarked questions fetched", {
      ...bookmarks,
      bookmarks: bookmarks.bookmarks.map((b) => ({
        ...b,
        question: sanitizeQuestion(b.question, { includeAnswerKey: false, includeInternal: false }),
      })),
    }, meta);
  } catch (err) {
    next(err);
  }
};

const bulkImportQuestions = async (req, res, next) => {
  try {
    const questions = await service.bulkCreateQuestions(req.body.questions, req.user.id);
    logger.info(`[Assessments] Admin ${req.user.id} imported ${questions.length} questions`);
    return created(res, "Questions imported", { count: questions.length });
  } catch (err) {
    logger.error(`[Assessments] Admin import failed by ${req.user?.id}: ${err.message}`);
    next(err);
  }
};

const bulkExportQuestions = async (req, res, next) => {
  try {
    const questions = await service.exportQuestions(req.query);
    logger.info(`[Assessments] Admin ${req.user.id} exported ${questions.length} questions`);
    return ok(res, "Questions exported", { count: questions.length, questions });
  } catch (err) {
    logger.error(`[Assessments] Admin export failed by ${req.user?.id}: ${err.message}`);
    next(err);
  }
};

const deactivateQuestions = async (req, res, next) => {
  try {
    const result = await service.setQuestionsActiveState(req.body.questionIds, req.body.isActive);
    return ok(res, "Question activation state updated", { updatedCount: result.count });
  } catch (err) {
    next(err);
  }
};

const updateQuestionReviewStatus = async (req, res, next) => {
  try {
    const question = await service.setQuestionReviewStatus(req.params.id, req.body.reviewStatus);
    if (!question) withNotFound("Assessment question");
    return ok(res, "Question review status updated", { question });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  createTopic,
  getTopicsByCategory,
  updateTopic,
  deleteTopic,
  createQuestion,
  bulkCreateQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestionById,
  searchQuestions,
  generateAssessment,
  startAssessmentAttempt,
  submitAnswer,
  saveProgress,
  finishAttempt,
  getAttemptResult,
  getAttemptHistory,
  getAttemptAnalytics,
  getUserPerformanceSummary,
  bookmarkQuestion,
  removeBookmark,
  getBookmarks,
  bulkImportQuestions,
  bulkExportQuestions,
  deactivateQuestions,
  updateQuestionReviewStatus,
};
