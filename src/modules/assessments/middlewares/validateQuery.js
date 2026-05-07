const validateQuery = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => ({ field: e.path.join("."), message: e.message }));
    return res.status(400).json({ success: false, message: "Invalid query parameters", errors });
  }
  req.query = parsed.data;
  next();
};

module.exports = { validateQuery };
