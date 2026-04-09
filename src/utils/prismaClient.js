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

const RETRYABLE_CODES = ["P1001", "P1002", "P1008", "P1017"];

const isRetryableError = (err) =>
  RETRYABLE_CODES.includes(err.code) ||
  err.message?.includes("kind: Closed") ||
  err.message?.includes("Can't reach database") ||
  err.message?.includes("Connection reset") ||
  err.message?.includes("ConnectionReset");

/**
 * Retry a single async fn up to maxAttempts times with linear backoff.
 * Used to absorb Neon free-tier cold starts (first query after ~5 min sleep).
 */
async function withRetry(fn, label, maxAttempts = 3, baseDelayMs = 3000) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryableError(err)) throw err;
      lastErr = err;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * attempt; // 3s, 6s
        logger.warn(`Neon cold start detected — retrying (${label}) attempt ${attempt}/${maxAttempts} in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

const handler = {
  get(target, prop) {
    const delegate = target[prop];

    // Top-level methods on prisma ($queryRaw, $transaction, etc.)
    if (typeof delegate === "function") {
      return (...args) => withRetry(() => delegate.apply(target, args), prop);
    }

    // Model delegates (prisma.user, prisma.submission, etc.) are objects
    if (typeof delegate !== "object" || delegate === null) return delegate;

    return new Proxy(delegate, {
      get(model, method) {
        const fn = model[method];
        if (typeof fn !== "function") return fn;
        return (...args) => withRetry(() => fn.apply(model, args), `${String(prop)}.${String(method)}`);
      },
    });
  },
};

module.exports = new Proxy(prisma, handler);
