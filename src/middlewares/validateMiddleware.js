const { badRequest } = require("../utils/apiResponse");

/**
 * Middleware factory: validates req.body against a Zod schema.
 * On failure, returns 400 with a structured list of field errors.
 */
const validate = (schema) => (req, res, next) => {
  if (!schema || typeof schema.safeParse !== "function") {
    return res.status(500).json({
      success: false,
      message: "Validation schema misconfigured",
    });
  }

  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error?.issues || result.error?.errors || [];
    const errors = issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }
  req.body = result.data; // use parsed/coerced data
  next();
};

module.exports = { validate };
