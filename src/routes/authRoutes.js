const { Router } = require("express");
const { signup, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const { validate } = require("../middlewares/validateMiddleware");
const { signupSchema, loginSchema } = require("../validators/authValidator");

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/me", authMiddleware, getMe);

module.exports = router;
