const { ok, created, badRequest } = require("../utils/apiResponse");
const topicsService = require("../services/engFundamentalsTopicsService");
const logger = require("../utils/logger");

// ── Validation helpers ────────────────────────────────────────────────────────

function validateTopicBody(body) {
  const { title, description, icon } = body;
  if (!title || title.length < 1 || title.length > 100)
    return "title must be 1-100 characters";
  if (!description || description.length < 1 || description.length > 300)
    return "description must be 1-300 characters";
  if (!icon || icon.length < 1 || icon.length > 10)
    return "icon must be 1-10 characters";
  return null;
}

// ── Controllers ───────────────────────────────────────────────────────────────

const getAllTopics = async (req, res, next) => {
  try {
    const result = await topicsService.getAllTopics(req.user.id);
    return ok(res, "Topics fetched successfully", result);
  } catch (err) {
    next(err);
  }
};

const getTopicById = async (req, res, next) => {
  try {
    const topic = await topicsService.getTopicById(req.params.id);
    return ok(res, "Topic fetched successfully", { topic });
  } catch (err) {
    next(err);
  }
};

const completeTopic = async (req, res, next) => {
  try {
    const result = await topicsService.completeTopic(req.user.id, req.params.id);
    return ok(res, "Topic marked as completed", result);
  } catch (err) {
    next(err);
  }
};

const uncompleteTopic = async (req, res, next) => {
  try {
    await topicsService.uncompleteTopic(req.user.id, req.params.id);
    return ok(res, "Topic completion removed");
  } catch (err) {
    next(err);
  }
};

const createTopic = async (req, res, next) => {
  try {
    const validationError = validateTopicBody(req.body);
    if (validationError) return badRequest(res, validationError);

    const topic = await topicsService.createTopic(req.body);
    logger.info(`[EngFundamentals] Topic created: ${topic.id} by admin ${req.user.id}`);
    return created(res, "Topic created successfully", { topic });
  } catch (err) {
    next(err);
  }
};

const updateTopic = async (req, res, next) => {
  try {
    const topic = await topicsService.updateTopic(req.params.id, req.body);
    logger.info(`[EngFundamentals] Topic updated: ${req.params.id} by admin ${req.user.id}`);
    return ok(res, "Topic updated successfully", { topic });
  } catch (err) {
    next(err);
  }
};

const deleteTopic = async (req, res, next) => {
  try {
    await topicsService.deleteTopic(req.params.id);
    logger.info(`[EngFundamentals] Topic deleted: ${req.params.id} by admin ${req.user.id}`);
    return ok(res, "Topic deleted successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTopics,
  getTopicById,
  completeTopic,
  uncompleteTopic,
  createTopic,
  updateTopic,
  deleteTopic,
};
