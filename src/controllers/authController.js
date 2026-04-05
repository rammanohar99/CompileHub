const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../utils/prismaClient");
const { ok, created, conflict, unauthorized } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

/** Shape subscription for API responses (omit internal Razorpay IDs). */
const formatSub = (sub) =>
  sub
    ? { plan: sub.plan, status: sub.status, startsAt: sub.startsAt, expiresAt: sub.expiresAt }
    : { plan: "FREE", status: "ACTIVE", startsAt: null, expiresAt: null };

// POST /auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return conflict(res, "An account with this email already exists");

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Create a FREE subscription for new user
    const sub = await prisma.subscription.create({ data: { userId: user.id } });

    const token = signToken(user);
    logger.info(`New user registered: ${email}`);

    return created(res, "Account created successfully", {
      user: { ...user, subscription: formatSub(sub) },
      token,
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });
    if (!user) return unauthorized(res, "Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return unauthorized(res, "Invalid email or password");

    const token = signToken(user);
    logger.info(`User logged in: ${email}`);

    return ok(res, "Login successful", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: formatSub(user.subscription),
      },
      token,
    });
  } catch (err) {
    next(err);
  }
};

// GET /auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        subscription: true,
      },
    });

    if (!user) return unauthorized(res, "User not found");

    return ok(res, "User profile fetched", {
      ...user,
      subscription: formatSub(user.subscription),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe };
