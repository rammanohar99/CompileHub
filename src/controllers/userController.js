const prisma = require("../utils/prismaClient");
const { ok, forbidden, notFound } = require("../utils/apiResponse");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" UTC string for a Date object. */
const toDateStr = (date) => date.toISOString().split("T")[0];

/**
 * Compute the Monday of the current UTC calendar week.
 * JS getUTCDay(): 0=Sun, 1=Mon, …, 6=Sat
 */
const getMondayOfCurrentWeek = () => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const day = now.getUTCDay(); // 0=Sun
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(monday.getUTCDate() + offset);
  return monday;
};

/** Build per-tag stats from a list of submission rows. */
const buildTagStats = (submissions) => {
  const tagStats = {}; // tag -> { attempted: Set<problemId>, passed: Set<problemId> }
  for (const s of submissions) {
    for (const tag of s.problem.tags) {
      if (!tagStats[tag]) tagStats[tag] = { attempted: new Set(), passed: new Set() };
      tagStats[tag].attempted.add(s.problemId);
      if (s.status === "PASSED") tagStats[tag].passed.add(s.problemId);
    }
  }
  return tagStats;
};

// ── GET /users/:userId/stats ──────────────────────────────────────────────────

const getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return forbidden(res, "You can only view your own stats");
    }

    const submissions = await prisma.submission.findMany({
      where: { userId },
      select: {
        problemId: true,
        status: true,
        createdAt: true,
        problem: { select: { difficulty: true } },
      },
    });

    // ── totalSolved ────────────────────────────────────────────────────────
    const passedProblemIds = new Set(
      submissions.filter((s) => s.status === "PASSED").map((s) => s.problemId)
    );
    const totalSolved = passedProblemIds.size;

    // ── solvedByDifficulty ─────────────────────────────────────────────────
    const solvedByDifficulty = { EASY: 0, MEDIUM: 0, HARD: 0 };
    const passedByDiff = {};
    for (const s of submissions) {
      if (s.status !== "PASSED") continue;
      const diff = s.problem.difficulty;
      if (!passedByDiff[diff]) passedByDiff[diff] = new Set();
      passedByDiff[diff].add(s.problemId);
    }
    for (const [diff, ids] of Object.entries(passedByDiff)) {
      solvedByDifficulty[diff] = ids.size;
    }

    // ── acceptanceRate ─────────────────────────────────────────────────────
    const totalSubmissions = submissions.length;
    const passedCount = submissions.filter((s) => s.status === "PASSED").length;
    const acceptanceRate =
      totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;

    // ── Active days set ────────────────────────────────────────────────────
    const activeDays = new Set(submissions.map((s) => toDateStr(s.createdAt)));

    // ── currentStreak ──────────────────────────────────────────────────────
    let currentStreak = 0;
    const checkDate = new Date();
    checkDate.setUTCHours(0, 0, 0, 0);
    while (activeDays.has(toDateStr(checkDate))) {
      currentStreak++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }

    // ── maxStreak ──────────────────────────────────────────────────────────
    const sortedDays = Array.from(activeDays).sort();
    let maxStreak = sortedDays.length > 0 ? 1 : 0;
    let runStreak = sortedDays.length > 0 ? 1 : 0;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diffDays = (curr - prev) / 86400000;
      if (diffDays === 1) {
        runStreak++;
        if (runStreak > maxStreak) maxStreak = runStreak;
      } else {
        runStreak = 1;
      }
    }

    // ── weekActivity: index 0=Monday … 6=Sunday ────────────────────────────
    const weekActivity = Array(7).fill(false);
    const monday = getMondayOfCurrentWeek();
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() + i);
      weekActivity[i] = activeDays.has(toDateStr(d));
    }

    return ok(res, "Stats fetched", {
      totalSolved,
      solvedByDifficulty,
      totalSubmissions,
      acceptanceRate,
      currentStreak,
      maxStreak,
      weekActivity,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /users/:userId/topic-performance ──────────────────────────────────────

const getTopicPerformance = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return forbidden(res, "You can only view your own topic performance");
    }

    const submissions = await prisma.submission.findMany({
      where: { userId },
      select: {
        problemId: true,
        status: true,
        problem: { select: { tags: true } },
      },
    });

    const tagStats = buildTagStats(submissions);

    const result = Object.entries(tagStats)
      .map(([topic, { attempted, passed }]) => ({
        topic,
        attempted: attempted.size,
        passed: passed.size,
        score: Math.round((passed.size / attempted.size) * 100),
      }))
      .sort((a, b) => a.score - b.score) // weakest first
      .slice(0, 10);

    return ok(res, "Topic performance fetched", result);
  } catch (err) {
    next(err);
  }
};

// ── GET /users/:userId/subscription ──────────────────────────────────────────

const getUserSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return forbidden(res, "You can only view your own subscription");
    }

    // Lazy-create FREE subscription if missing
    let sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) {
      sub = await prisma.subscription.create({ data: { userId } });
    }

    return ok(res, "Subscription fetched", {
      plan: sub.plan,
      status: sub.status,
      startsAt: sub.startsAt,
      expiresAt: sub.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserStats, getTopicPerformance, getUserSubscription, buildTagStats };
