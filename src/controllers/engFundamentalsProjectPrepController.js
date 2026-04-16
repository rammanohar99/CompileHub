const { ok, created, badRequest } = require("../utils/apiResponse");
const projectPrepService = require("../services/engFundamentalsProjectPrepService");
const logger = require("../utils/logger");

const generateSession = async (req, res, next) => {
  try {
    const { description } = req.body;
    if (typeof description !== "string" || description.length < 20 || description.length > 2000) {
      return badRequest(res, "description must be a string between 20 and 2000 characters");
    }

    const result = await projectPrepService.generateSession(req.user.id, description.trim());
    logger.info(`[EngFundamentals] Project prep session created: ${result.sessionId} by user ${req.user.id}`);
    return created(res, "Project prep session created", result);
  } catch (err) {
    next(err);
  }
};

const getMySessions = async (req, res, next) => {
  try {
    const result = await projectPrepService.getMySessions(req.user.id);
    return ok(res, "Sessions fetched successfully", result);
  } catch (err) {
    next(err);
  }
};

const deleteSession = async (req, res, next) => {
  try {
    await projectPrepService.deleteSession(req.user.id, req.params.id);
    return ok(res, "Session deleted successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { generateSession, getMySessions, deleteSession };
