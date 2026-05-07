const { PrismaClient } = require("@prisma/client");
const logger = require("./logger");

const DEFAULT_POOL_SIZE = parseInt(process.env.PRISMA_POOL_MAX || "10", 10);
const DEFAULT_POOL_TIMEOUT_S = parseInt(process.env.PRISMA_POOL_TIMEOUT_S || "30", 10);
const DEFAULT_CONNECT_TIMEOUT_S = parseInt(process.env.PRISMA_CONNECT_TIMEOUT_S || "15", 10);

function withPoolConfig(urlString) {
  if (!urlString) return urlString;
  try {
    const url = new URL(urlString);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", String(DEFAULT_POOL_SIZE));
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", String(DEFAULT_POOL_TIMEOUT_S));
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", String(DEFAULT_CONNECT_TIMEOUT_S));
    }
    return url.toString();
  } catch {
    // Fall back to raw URL if it's not parseable.
    return urlString;
  }
}

const prisma =
  global.__prisma ||
  new PrismaClient({
    log: ["error"],
    datasources: {
      db: { url: withPoolConfig(process.env.DATABASE_URL) },
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

function detectDbProviderLabel(urlString) {
  if (!urlString) return "database";
  try {
    const host = new URL(urlString).hostname.toLowerCase();
    if (host.includes("neon.tech")) return "Neon";
    if (host.includes("googleapis.com") || host.includes("gcp") || host.includes("cloudsql")) return "Cloud SQL";
    return "database";
  } catch {
    return "database";
  }
}

/**
 * Retry a single async fn up to maxAttempts times with linear backoff.
 * Helps absorb transient startup/network hiccups on managed Postgres.
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
        const providerLabel = detectDbProviderLabel(process.env.DATABASE_URL);
        logger.warn(
          `${providerLabel} connection not ready - retrying (${label}) attempt ${attempt}/${maxAttempts} in ${delay}ms...`
        );
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
