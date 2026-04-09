const { Router } = require("express");
const {
  getUserStats,
  getUserActivity,
  getTopicStrength,
  getLearningPath,
  getUserSubscription,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const { getUserSubmissions } = require("../controllers/submissionController");

const router = Router();

router.get("/:userId/stats",          authMiddleware, getUserStats);
router.get("/:userId/activity",       authMiddleware, getUserActivity);
router.get("/:userId/topic-strength", authMiddleware, getTopicStrength);
router.get("/:userId/learning-path",  authMiddleware, getLearningPath);
router.get("/:userId/subscription",   authMiddleware, getUserSubscription);
router.get("/:userId/submissions",    authMiddleware, getUserSubmissions);

module.exports = router;
