const logger = require("../utils/logger");

// 404 handler — place after all routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Global error handler — must have 4 params for Express to treat it as error middleware
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(err);

  // Prisma known errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
      field: err.meta?.target,
    });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ success: false, message: "Record not found" });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFoundHandler, errorHandler };
