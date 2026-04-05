const { badRequest } = require("../utils/apiResponse");

/**
 * Middleware factory: validates req.body against a Zod schema.
 * On failure, returns 400 with a structured list of field errors.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }
  req.body = result.data; // use parsed/coerced data
  next();
};

module.exports = { validate };
