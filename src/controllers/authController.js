const bcrypt = require("bcryptjs");
const prisma = require("../utils/prismaClient");
const { ok, created, conflict, unauthorized, badRequest, notFound } = require("../utils/apiResponse");
const logger = require("../utils/logger");
const {
  ACCESS_TOKEN_EXPIRES_IN,
  signAccessToken,
  createRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiryDate,
} = require("../utils/tokenService");

const configuredRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
const SALT_ROUNDS = Number.isNaN(configuredRounds)
  ? 10
  : Math.min(12, Math.max(10, configuredRounds));

/** Shape subscription for API responses (omit internal Razorpay IDs). */
const formatSub = (sub) =>
  sub
    ? { plan: sub.plan, status: sub.status, startsAt: sub.startsAt, expiresAt: sub.expiresAt }
    : { plan: "FREE", status: "ACTIVE", startsAt: null, expiresAt: null };

const hasRefreshTokenModel = () => !!prisma.refreshToken;

async function issueAuthTokens(userId, email, role) {
  const accessToken = signAccessToken({ id: userId, email, role });
  if (!hasRefreshTokenModel()) {
    return { accessToken, refreshToken: null, refreshTokenExpiresAt: null };
  }

  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const refreshTokenExpiresAt = getRefreshTokenExpiryDate();

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: refreshTokenHash,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return { accessToken, refreshToken, refreshTokenExpiresAt };
}

async function cleanupExpiredRefreshTokens(userId) {
  if (!hasRefreshTokenModel()) return;
  await prisma.refreshToken.deleteMany({
    where: {
      userId,
      OR: [{ revoked: true }, { expiresAt: { lt: new Date() } }],
    },
  });
}

// POST /auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return conflict(res, "An account with this email already exists");

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Create a FREE subscription for new user
    const sub = await prisma.subscription.create({
      data: { userId: user.id },
      select: { plan: true, status: true, startsAt: true, expiresAt: true },
    });

    const { accessToken, refreshToken, refreshTokenExpiresAt } = await issueAuthTokens(
      user.id,
      user.email,
      user.role
    );
    logger.info(`New user registered: ${email}`);

    return created(res, "Account created successfully", {
      user: { ...user, subscription: formatSub(sub) },
      token: accessToken,
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN,
      refreshTokenExpiresAt,
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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        subscription: {
          select: { plan: true, status: true, startsAt: true, expiresAt: true },
        },
      },
    });
    if (!user) return unauthorized(res, "No account registered with this email");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return unauthorized(res, "Incorrect password");

    await cleanupExpiredRefreshTokens(user.id);
    const { accessToken, refreshToken, refreshTokenExpiresAt } = await issueAuthTokens(
      user.id,
      user.email,
      user.role
    );
    logger.info(`User logged in: ${email}`);

    return ok(res, "Login successful", {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: formatSub(user.subscription),
      },
      token: accessToken,
      accessToken,
      refreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN,
      refreshTokenExpiresAt,
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
        subscription: {
          select: { plan: true, status: true, startsAt: true, expiresAt: true },
        },
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

// POST /auth/refresh
const refresh = async (req, res, next) => {
  try {
    if (!hasRefreshTokenModel()) {
      return unauthorized(res, "Refresh tokens are not available yet. Run latest Prisma migration and generate client.");
    }

    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== "string") {
      return badRequest(res, "refreshToken is required");
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return unauthorized(res, "Invalid or expired refresh token");
    }

    const rotationOk = await prisma.$transaction(async (tx) => {
      const revokeResult = await tx.refreshToken.updateMany({
        where: { id: stored.id, revoked: false, expiresAt: { gt: new Date() } },
        data: { revoked: true },
      });
      await tx.refreshToken.deleteMany({
        where: {
          userId: stored.userId,
          OR: [{ revoked: true }, { expiresAt: { lt: new Date() } }],
        },
      });
      return revokeResult.count === 1;
    });

    if (!rotationOk) {
      return unauthorized(res, "Invalid or expired refresh token");
    }

    const { accessToken, refreshToken: nextRefreshToken, refreshTokenExpiresAt } = await issueAuthTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role
    );

    return ok(res, "Token refreshed", {
      token: accessToken,
      accessToken,
      refreshToken: nextRefreshToken,
      accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN,
      refreshTokenExpiresAt,
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/logout
const logout = async (req, res, next) => {
  try {
    if (!hasRefreshTokenModel()) {
      return ok(res, "Logged out successfully", { loggedOut: true, allSessions: !!req.body?.allSessions });
    }

    const { refreshToken, allSessions = false } = req.body || {};

    if (allSessions) {
      await prisma.refreshToken.updateMany({
        where: { userId: req.user.id, revoked: false },
        data: { revoked: true },
      });
      return ok(res, "Logged out successfully", { loggedOut: true, allSessions: true });
    }

    if (!refreshToken || typeof refreshToken !== "string") {
      return badRequest(res, "refreshToken is required unless allSessions=true");
    }

    const tokenHash = hashRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, userId: req.user.id, revoked: false },
      data: { revoked: true },
    });

    return ok(res, "Logged out successfully", { loggedOut: true, allSessions: false });
  } catch (err) {
    next(err);
  }
};

// GET /auth/sessions
const getSessions = async (req, res, next) => {
  try {
    if (!hasRefreshTokenModel()) {
      return ok(res, "Sessions fetched", { sessions: [] });
    }

    const sessions = await prisma.refreshToken.findMany({
      where: { userId: req.user.id, revoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, expiresAt: true },
    });
    return ok(res, "Sessions fetched", { sessions });
  } catch (err) {
    next(err);
  }
};

// DELETE /auth/sessions/:id
const revokeSession = async (req, res, next) => {
  try {
    if (!hasRefreshTokenModel()) {
      return notFound(res, "Session not found");
    }

    const { id } = req.params;
    const exists = await prisma.refreshToken.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!exists || exists.userId !== req.user.id) {
      return notFound(res, "Session not found");
    }

    await prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });

    return ok(res, "Session revoked", { revoked: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe, refresh, logout, getSessions, revokeSession };
