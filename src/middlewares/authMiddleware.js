const { unauthorized } = require("../utils/apiResponse");
const { verifyAccessToken } = require("../utils/tokenService");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized(res, "Access token missing or malformed");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type && decoded.type !== "access") {
      return unauthorized(res, "Invalid access token");
    }
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return unauthorized(res, "Access token has expired");
    }
    return unauthorized(res, "Invalid access token");
  }
};

module.exports = authMiddleware;
