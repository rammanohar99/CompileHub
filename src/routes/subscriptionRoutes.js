const { Router } = require("express");
const { createOrder, verifyPayment } = require("../controllers/subscriptionController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = Router();

router.post("/order", authMiddleware, createOrder);
router.post("/verify", authMiddleware, verifyPayment);

module.exports = router;
