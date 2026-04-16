const { ok, created, badRequest } = require("../utils/apiResponse");
const templatesService = require("../services/engFundamentalsTemplatesService");
const logger = require("../utils/logger");

const getAllTemplates = async (req, res, next) => {
  try {
    const templates = await templatesService.getAllTemplates(req.user.id);
    return ok(res, "Templates fetched successfully", { templates });
  } catch (err) {
    next(err);
  }
};

const viewTemplate = async (req, res, next) => {
  try {
    const result = await templatesService.viewTemplate(req.user.id, req.params.id);
    return ok(res, "Template view recorded", result);
  } catch (err) {
    next(err);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const { title, description, icon, steps, example } = req.body;
    if (!title) return badRequest(res, "title is required");
    if (!description) return badRequest(res, "description is required");
    if (!icon) return badRequest(res, "icon is required");
    if (!Array.isArray(steps) || steps.length < 1 || steps.length > 10) {
      return badRequest(res, "steps must be an array of 1-10 items");
    }
    for (const step of steps) {
      if (!step.label || !step.detail) {
        return badRequest(res, "each step must have label and detail fields");
      }
    }
    if (!example) return badRequest(res, "example is required");

    const template = await templatesService.createTemplate(req.body);
    logger.info(`[EngFundamentals] Template created: ${template.id} by admin ${req.user.id}`);
    return created(res, "Template created successfully", { template });
  } catch (err) {
    next(err);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const template = await templatesService.updateTemplate(req.params.id, req.body);
    logger.info(`[EngFundamentals] Template updated: ${req.params.id} by admin ${req.user.id}`);
    return ok(res, "Template updated successfully", { template });
  } catch (err) {
    next(err);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    await templatesService.deleteTemplate(req.params.id);
    logger.info(`[EngFundamentals] Template deleted: ${req.params.id} by admin ${req.user.id}`);
    return ok(res, "Template deleted successfully");
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllTemplates, viewTemplate, createTemplate, updateTemplate, deleteTemplate };
