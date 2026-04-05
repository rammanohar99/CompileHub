const { PrismaClient } = require("@prisma/client");
const logger = require("./logger");

const prisma =
  global.__prisma ||
  new PrismaClient({
    log: ["error"],
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

/**
 * Neon free tier suspends after ~5 min of inactivity.
 * First query after wake-up fails with "kind: Closed".
 * This wrapper retries once on that specific error.
 */
const RETRYABLE_CODES = ["P1001", "P1002", "P1008", "P1017"];

const handler = {
  get(target, prop) {
    const delegate = target[prop];
    if (typeof delegate !== "object" || delegate === null) return delegate;

    return new Proxy(delegate, {
      get(model, method) {
        const fn = model[method];
        if (typeof fn !== "function") return fn;

        return async (...args) => {
          try {
            return await fn.apply(model, args);
          } catch (err) {
            const isRetryable =
              RETRYABLE_CODES.includes(err.code) ||
              err.message?.includes("kind: Closed") ||
              err.message?.includes("Can't reach database");

            if (isRetryable) {
              logger.warn(`Neon cold start detected — retrying query (${String(method)})...`);
              await new Promise((r) => setTimeout(r, 2000)); // wait 2s for Neon to wake
              return await fn.apply(model, args);
            }
            throw err;
          }
        };
      },
    });
  },
};

module.exports = new Proxy(prisma, handler);
