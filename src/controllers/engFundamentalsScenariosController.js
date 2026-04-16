const { ok, created, badRequest } = require("../utils/apiResponse");
const scenariosService = require("../services/engFundamentalsScenariosService");
const logger = require("../utils/logger");

const VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

// ── Pagination helper ─────────────────────────────────────────────────────────

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  return { page, limit };
}

// ── Controllers ───────────────────────────────────────────────────────────────

const getAllScenarios = async (req, res, next) => {
  try {
    const { difficulty } = req.query;
    if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
      return badRequest(res, `difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`);
    }

    const { page, limit } = parsePagination(req.query);
    const result = await scenariosService.getAllScenarios({
      userId: req.user.id,
      difficulty,
      page,
      limit,
    });

    return ok(res, "Scenarios fetched successfully", result);
  } catch (err) {
    next(err);
  }
};

const submitAttempt = async (req, res, next) => {
  try {
    const { picked } = req.body;
    if (picked === undefined || !Number.isInteger(picked)) {
      return badRequest(res, "picked must be an integer");
    }

    const result = await scenariosService.submitAttempt(req.user.id, req.params.id, picked);
    logger.info(`[EngFundamentals] Scenario attempt: ${req.params.id} by user ${req.user.id} — correct: ${result.correct}`);
    return ok(res, "Attempt submitted", result);
  } catch (err) {
    next(err);
  }
};

const createScenario = async (req, res, next) => {
  try {
    const { title, description, difficulty, hypotheses, correctIndex, explanation } = req.body;
    if (!title) return badRequest(res, "title is required");
    if (!description) return badRequest(res, "description is required");
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return badRequest(res, `difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`);
    }
    if (!Array.isArray(hypotheses) || hypotheses.length < 2 || hypotheses.length > 6) {
      return badRequest(res, "hypotheses must be an array of 2-6 items");
    }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= hypotheses.length) {
      return badRequest(res, "correctIndex must be a valid index into hypotheses");
    }
    if (!explanation) return badRequest(res, "explanation is required");

    const scenario = await scenariosService.createScenario(req.body);
    logger.info(`[EngFundamentals] Scenario created: ${scenario.id} by admin ${req.user.id}`);
    return created(res, "Scenario created successfully", { scenario });
  } catch (err) {
    next(err);
  }
};

const updateScenario = async (req, res, next) => {
  try {
    const scenario = await scenariosService.updateScenario(req.params.id, req.body);
    logger.info(`[EngFundamentals] Scenario updated: ${req.params.id} by admin ${req.user.id}`);
    return ok(res, "Scenario updated successfully", { scenario });
  } catch (err) {
    next(err);
  }
};

const deleteScenario = async (req, res, next) => {
  try {
    await scenariosService.deleteScenario(req.params.id);
    logger.info(`[EngFundamentals] Scenario deleted: ${req.params.id} by admin ${req.user.id}`);
    return ok(res, "Scenario deleted successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllScenarios, submitAttempt, createScenario, updateScenario, deleteScenario };
