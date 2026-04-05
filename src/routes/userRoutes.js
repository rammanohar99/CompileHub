const { Router } = require("express");
const { getUserStats, getTopicPerformance, getUserSubscription } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = Router();

router.get("/:userId/stats", authMiddleware, getUserStats);
router.get("/:userId/topic-performance", authMiddleware, getTopicPerformance);
router.get("/:userId/subscription", authMiddleware, getUserSubscription);
router.get("/:userId/submissions", authMiddleware, require("../controllers/submissionController").getUserSubmissions);

module.exports = router;
