const { Router } = require("express");
const {
  getProblems,
  getProblem,
  getRecommendedProblems,
  createProblem,
  addTestCases,
} = require("../controllers/problemController");
const authMiddleware = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const { validate } = require("../middlewares/validateMiddleware");
const { createProblemSchema, addTestCasesSchema } = require("../validators/problemValidator");

const router = Router();

// Authenticated routes — order matters: /recommended must come before /:id
router.get("/recommended", authMiddleware, getRecommendedProblems);
router.get("/", authMiddleware, getProblems);
router.get("/:id", authMiddleware, getProblem);

// Admin-only routes
router.post("/", authMiddleware, requireRole("ADMIN"), validate(createProblemSchema), createProblem);
router.post("/:id/testcases", authMiddleware, requireRole("ADMIN"), validate(addTestCasesSchema), addTestCases);

module.exports = router;
