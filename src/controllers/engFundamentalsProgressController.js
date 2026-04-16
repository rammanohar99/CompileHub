const { ok } = require("../utils/apiResponse");
const progressService = require("../services/engFundamentalsProgressService");

const getProgress = async (req, res, next) => {
  try {
    const progress = await progressService.getProgress(req.user.id);
    return ok(res, "Progress fetched successfully", progress);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProgress };
