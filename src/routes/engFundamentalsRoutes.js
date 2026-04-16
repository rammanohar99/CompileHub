const { Router } = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

const {
  getAllTopics,
  getTopicById,
  completeTopic,
  uncompleteTopic,
  createTopic,
  updateTopic,
  deleteTopic,
} = require("../controllers/engFundamentalsTopicsController");

const {
  getAllScenarios,
  submitAttempt,
  createScenario,
  updateScenario,
  deleteScenario,
} = require("../controllers/engFundamentalsScenariosController");

const {
  getAllTemplates,
  viewTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../controllers/engFundamentalsTemplatesController");

const { getProgress } = require("../controllers/engFundamentalsProgressController");

const {
  generateSession,
  getMySessions,
  deleteSession,
} = require("../controllers/engFundamentalsProjectPrepController");

const router = Router();

// ── Topics ────────────────────────────────────────────────────────────────────
router.get("/topics", authMiddleware, getAllTopics);
router.get("/topics/:id", authMiddleware, getTopicById);
router.post("/topics/:id/complete", authMiddleware, completeTopic);
router.delete("/topics/:id/complete", authMiddleware, uncompleteTopic);
router.post("/topics", authMiddleware, requireRole("ADMIN"), createTopic);
router.put("/topics/:id", authMiddleware, requireRole("ADMIN"), updateTopic);
router.delete("/topics/:id", authMiddleware, requireRole("ADMIN"), deleteTopic);

// ── Scenarios ─────────────────────────────────────────────────────────────────
router.get("/scenarios", authMiddleware, getAllScenarios);
router.post("/scenarios/:id/attempt", authMiddleware, submitAttempt);
router.post("/scenarios", authMiddleware, requireRole("ADMIN"), createScenario);
router.put("/scenarios/:id", authMiddleware, requireRole("ADMIN"), updateScenario);
router.delete("/scenarios/:id", authMiddleware, requireRole("ADMIN"), deleteScenario);

// ── Templates ─────────────────────────────────────────────────────────────────
router.get("/templates", authMiddleware, getAllTemplates);
router.post("/templates/:id/view", authMiddleware, viewTemplate);
router.post("/templates", authMiddleware, requireRole("ADMIN"), createTemplate);
router.put("/templates/:id", authMiddleware, requireRole("ADMIN"), updateTemplate);
router.delete("/templates/:id", authMiddleware, requireRole("ADMIN"), deleteTemplate);

// ── Project Prep ──────────────────────────────────────────────────────────────
router.post("/project-prep", authMiddleware, generateSession);
router.get("/project-prep", authMiddleware, getMySessions);
router.delete("/project-prep/:id", authMiddleware, deleteSession);

// ── Progress ──────────────────────────────────────────────────────────────────
router.get("/progress", authMiddleware, getProgress);

module.exports = router;
