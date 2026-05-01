const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_DAYS = Math.max(7, parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || "30", 10) || 30);

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: "access" },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function createRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getRefreshTokenExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  return d;
}

module.exports = {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_DAYS,
  signAccessToken,
  verifyAccessToken,
  createRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiryDate,
};
