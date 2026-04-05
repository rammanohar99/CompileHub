const app = require("./src/app");
const logger = require("./src/utils/logger");
const prisma = require("./src/utils/prismaClient");

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Verify DB connection before accepting traffic
    await prisma.$connect();
    logger.info("Database connected successfully");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

start();
