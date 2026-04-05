const { Router } = require("express");
const { submit, getSubmission, getUserSubmissions } = require("../controllers/submissionController");
const authMiddleware = require("../middlewares/authMiddleware");
const { checkDailyRunLimit } = require("../middlewares/planMiddleware");
const { validate } = require("../middlewares/validateMiddleware");
const { submitSchema } = require("../validators/submissionValidator");
const { runTestCase } = require("../services/judge0Service");
const { ok, badRequest } = require("../utils/apiResponse");

const router = Router();

router.post("/submit", authMiddleware, validate(submitSchema), submit);
router.get("/submissions/:id", authMiddleware, getSubmission);

// POST /api/run — ad-hoc code execution with plan-based daily rate limit
router.post("/api/run", authMiddleware, checkDailyRunLimit, async (req, res, next) => {
  try {
    const { code, languageId, stdin = "" } = req.body;

    if (!code || !languageId) {
      return badRequest(res, "code and languageId are required");
    }

    const result = await runTestCase(code, parseInt(languageId), stdin, "");

    return ok(res, "Code executed", {
      stdout: result.stdout,
      stderr: result.stderr,
      compileOutput: result.compileOutput,
      executionTime: result.executionTime,
      statusDescription: result.statusDescription,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
