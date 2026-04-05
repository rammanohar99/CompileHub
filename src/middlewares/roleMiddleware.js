const { forbidden } = require("../utils/apiResponse");

/**
 * Factory that returns a middleware enforcing one or more allowed roles.
 * Usage: requireRole("ADMIN") or requireRole("ADMIN", "MODERATOR")
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return forbidden(res, "Authentication required");
    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Access restricted to: ${roles.join(", ")}`);
    }
    next();
  };
};

module.exports = { requireRole };
