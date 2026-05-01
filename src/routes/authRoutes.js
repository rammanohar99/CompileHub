const { Router } = require("express");
const { signup, login, getMe, refresh, logout, getSessions, revokeSession } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validateMiddleware");
const { signupSchema, loginSchema, refreshSchema, logoutSchema } = require("../validators/authValidator");

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", authMiddleware, validate(logoutSchema), logout);
router.get("/me", authMiddleware, getMe);
router.get("/sessions", authMiddleware, getSessions);
router.delete("/sessions/:id", authMiddleware, revokeSession);

module.exports = router;
