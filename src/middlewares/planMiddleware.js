const prisma = require("../utils/prismaClient");
const { forbidden, tooMany } = require("../utils/apiResponse");

const PLAN_ORDER = { FREE: 0, BASIC: 1, PRO: 2, PREMIUM: 3 };
const FREE_BASIC_DAILY_LIMIT = 5;

/**
 * Fetch the user's current subscription plan from DB.
 * Falls back to FREE if no subscription record exists.
 */
const getUserPlan = async (userId) => {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return sub?.plan ?? "FREE";
};

/**
 * Middleware factory — blocks the request if the user's plan rank is below minPlan.
 * @param {"FREE"|"BASIC"|"PRO"|"PREMIUM"} minPlan
 */
const requirePlan = (minPlan) => async (req, res, next) => {
  try {
    const plan = await getUserPlan(req.user.id);
    if (PLAN_ORDER[plan] >= PLAN_ORDER[minPlan]) return next();
    return forbidden(res, `This feature requires the ${minPlan} plan or higher. Please upgrade.`);
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware — tracks daily compiler runs for FREE and BASIC users.
 * PRO and PREMIUM users are always passed through.
 * Returns 429 once the daily limit (5) is reached.
 */
const checkDailyRunLimit = async (req, res, next) => {
  try {
    const plan = await getUserPlan(req.user.id);

    // Unlimited for PRO and PREMIUM
    if (plan === "PRO" || plan === "PREMIUM") return next();

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD UTC
    const userId = req.user.id;

    const usage = await prisma.dailyUsage.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (usage && usage.runCount >= FREE_BASIC_DAILY_LIMIT) {
      return tooMany(res, "Daily compiler limit reached. Upgrade to Pro for unlimited runs.");
    }

    // Increment (upsert so it works on first run of the day too)
    await prisma.dailyUsage.upsert({
      where: { userId_date: { userId, date: today } },
      update: { runCount: { increment: 1 } },
      create: { userId, date: today, runCount: 1 },
    });

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requirePlan, checkDailyRunLimit, getUserPlan };
