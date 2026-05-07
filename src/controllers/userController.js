const prisma = require("../utils/prismaClient");
const { ok, forbidden, notFound, badRequest } = require("../utils/apiResponse");
const cache = require("../utils/cache");

// ── Helpers ───────────────────────────────────────────────────────────────────

const toDateStr = (date) => new Date(date).toISOString().split("T")[0];

/**
 * XP Level formula:
 *   level         = floor(sqrt(xp / 100))
 *   xpToNextLevel = ((level+1)^2 * 100) - xp
 *   xpProgress    = xp - (level^2 * 100)
 */
function computeLevel(xp) {
  const level = Math.floor(Math.sqrt(xp / 100));
  const xpToNextLevel = Math.pow(level + 1, 2) * 100 - xp;
  const xpProgress = xp - Math.pow(level, 2) * 100;
  return { level, xpToNextLevel, xpProgress };
}

/** Compute current streak and longest streak from a sorted array of "YYYY-MM-DD" strings. */
function computeStreaks(sortedDays) {
  if (!sortedDays.length) return { currentStreak: 0, longestStreak: 0 };

  const daySet = new Set(sortedDays);

  // Current streak: count back from today
  let currentStreak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  while (daySet.has(toDateStr(cursor))) {
    currentStreak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // Longest streak: sliding window over sorted unique dates
  let longestStreak = sortedDays.length > 0 ? 1 : 0;
  let run = sortedDays.length > 0 ? 1 : 0;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diff = (curr - prev) / 86_400_000;
    if (diff === 1) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 1;
    }
  }

  return { currentStreak, longestStreak };
}

// Learning path curriculum (fixed global order)
const CURRICULUM = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked Lists",
  "Trees",
  "Tries",
  "Heap / Priority Queue",
  "Backtracking",
  "Graphs",
  "Dynamic Programming",
];
const LP_THRESHOLD = 3; // solves needed to mark a topic done
const AGG_CACHE_TTL_SECONDS = 60;
const PROBLEMS_TAGS_CACHE_KEY = "problems:tags:minimal";

async function getProblemsTagsSnapshot() {
  let problems = cache.get(PROBLEMS_TAGS_CACHE_KEY);
  if (!problems) {
    problems = await prisma.problem.findMany({ select: { id: true, tags: true } });
    cache.set(PROBLEMS_TAGS_CACHE_KEY, problems, 300);
  }
  return problems;
}

// ── GET /users/:userId/stats ──────────────────────────────────────────────────

const getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return forbidden(res, "You can only view your own stats");
    }

    const cacheKey = `user:stats:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return ok(res, "Stats fetched", cached);

    const [user, submissions, sdSubmissions, assessmentAttempts] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { xp: true } }),
      prisma.submission.findMany({
        where: { userId },
        select: { problemId: true, status: true, createdAt: true },
      }),
      prisma.systemDesignSubmission.findMany({
        where: { userId },
        select: { createdAt: true },
      }),
      prisma.assessmentAttempt.findMany({
        where: { userId, status: "COMPLETED" },
        select: { createdAt: true, accuracy: true },
      }),
    ]);

    if (!user) return notFound(res, "User not found");

    // XP & Level
    const { level, xpToNextLevel, xpProgress } = computeLevel(user.xp);

    // Problems solved (unique with ≥1 PASSED)
    const passedIds = new Set(
      submissions.filter((s) => s.status === "PASSED").map((s) => s.problemId)
    );

    // Acceptance rate (code submissions only)
    const totalSubmissions = submissions.length;
    const passedCount = submissions.filter((s) => s.status === "PASSED").length;
    const acceptanceRate =
      totalSubmissions > 0
        ? Math.round((passedCount / totalSubmissions) * 1000) / 10  // 1 decimal
        : 0;

    // Streak — union code + SD + assessment dates
    const allDates = [
      ...submissions.map((s) => toDateStr(s.createdAt)),
      ...sdSubmissions.map((s) => toDateStr(s.createdAt)),
      ...assessmentAttempts.map((a) => toDateStr(a.createdAt)),
    ];
    const sortedUniqueDays = Array.from(new Set(allDates)).sort();
    const { currentStreak, longestStreak } = computeStreaks(sortedUniqueDays);

    const assessmentsCompleted = assessmentAttempts.length;
    const averageAssessmentAccuracy =
      assessmentsCompleted > 0
        ? Math.round(assessmentAttempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / assessmentsCompleted * 10) / 10
        : 0;

    const data = {
      xp: user.xp,
      level,
      xpToNextLevel,
      xpProgress,
      streak: currentStreak,
      longestStreak,
      problemsSolved: passedIds.size,
      totalSubmissions,
      acceptanceRate,
      sdAnswersSubmitted: sdSubmissions.length,
      assessmentsCompleted,
      averageAssessmentAccuracy,
    };
    cache.set(cacheKey, data, AGG_CACHE_TTL_SECONDS);
    return ok(res, "Stats fetched", data);
  } catch (err) {
    next(err);
  }
};

// ── GET /users/:userId/activity ───────────────────────────────────────────────

const getUserActivity = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return forbidden(res, "You can only view your own activity");
    }

    // Date range defaults
    const toDate = req.query.to ? new Date(req.query.to) : new Date();
    toDate.setUTCHours(23, 59, 59, 999);

    const fromDate = req.query.from
      ? new Date(req.query.from)
      : new Date(toDate.getTime() - 364 * 86_400_000);
    fromDate.setUTCHours(0, 0, 0, 0);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return badRequest(res, "Invalid date format");
    }

    const fromKey = fromDate.toISOString().slice(0, 10);
    const toKey = toDate.toISOString().slice(0, 10);
    const cacheKey = `user:activity:${userId}:${fromKey}:${toKey}`;
    const cached = cache.get(cacheKey);
    if (cached) return ok(res, "Activity fetched", { activity: cached });

    const activity = await prisma.$queryRaw`
      SELECT date, SUM(count)::int AS count
      FROM (
        SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM "Submission"
        WHERE "userId" = ${userId} AND "createdAt" >= ${fromDate} AND "createdAt" <= ${toDate}
        GROUP BY 1
        UNION ALL
        SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM "SystemDesignSubmission"
        WHERE "userId" = ${userId} AND "createdAt" >= ${fromDate} AND "createdAt" <= ${toDate}
        GROUP BY 1
        UNION ALL
        SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM "AssessmentAttempt"
        WHERE "userId" = ${userId} AND status = 'COMPLETED' AND "createdAt" >= ${fromDate} AND "createdAt" <= ${toDate}
        GROUP BY 1
      ) t
      GROUP BY date
      ORDER BY date ASC
    `;
    cache.set(cacheKey, activity, AGG_CACHE_TTL_SECONDS);

    return ok(res, "Activity fetched", { activity });
  } catch (err) {
    next(err);
  }
};

// ── GET /users/:userId/topic-strength ─────────────────────────────────────────

const getTopicStrength = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return forbidden(res, "You can only view your own topic strength");
    }

    const cacheKey = `user:topic-strength:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return ok(res, "Topic strength fetched", { topics: cached });

    const problems = await getProblemsTagsSnapshot();

    // Unique problems the user has PASSED
    const passedSubmissions = await prisma.submission.findMany({
      where: { userId, status: "PASSED" },
      select: { problemId: true },
      distinct: ["problemId"],
    });

    const solvedProblemIds = new Set(passedSubmissions.map((s) => s.problemId));

    // Build tag → { total, solved }
    const tagMap = {}; // tag -> { total: Set<problemId>, solved: Set<problemId> }
    for (const p of problems) {
      for (const tag of p.tags) {
        if (!tagMap[tag]) tagMap[tag] = { total: new Set(), solved: new Set() };
        tagMap[tag].total.add(p.id);
        if (solvedProblemIds.has(p.id)) tagMap[tag].solved.add(p.id);
      }
    }

    const topics = Object.entries(tagMap)
      .filter(([, v]) => v.total.size >= 3)
      .map(([label, v]) => {
        const solved = v.solved.size;
        const total = v.total.size;
        const score = Math.min(100, Math.round((solved / total) * 100));
        return { label, score, solved, total };
      })
      .sort((a, b) => a.score - b.score) // weakest first
      .slice(0, 8);

    cache.set(cacheKey, topics, AGG_CACHE_TTL_SECONDS);
    return ok(res, "Topic strength fetched", { topics });
  } catch (err) {
    next(err);
  }
};

// ── GET /users/:userId/learning-path ─────────────────────────────────────────

const getLearningPath = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "ADMIN" && req.user.id !== userId) {
      return forbidden(res, "You can only view your own learning path");
    }

    const cacheKey = `user:learning-path:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return ok(res, "Learning path fetched", cached);

    const problems = await getProblemsTagsSnapshot();

    // All PASSED submissions for this user, ordered by createdAt
    const passedSubs = await prisma.submission.findMany({
      where: { userId, status: "PASSED" },
      orderBy: { createdAt: "asc" },
      select: { problemId: true, createdAt: true },
    });

    // Build tag → Set<problemId> for all problems
    const tagProblems = {}; // tag -> Set<problemId>
    for (const p of problems) {
      for (const tag of p.tags) {
        if (!tagProblems[tag]) tagProblems[tag] = new Set();
        tagProblems[tag].add(p.id);
      }
    }

    // Build per-problem first-pass date
    const firstPassDate = {}; // problemId -> Date
    for (const s of passedSubs) {
      if (!firstPassDate[s.problemId]) {
        firstPassDate[s.problemId] = s.createdAt;
      }
    }

    const solvedSet = new Set(Object.keys(firstPassDate));

    let foundCurrent = false;

    const topicsResult = CURRICULUM.map((label) => {
      const problemIds = tagProblems[label] ?? new Set();
      // Count unique problems with PASSED submissions in this tag
      const solvedInTag = [...problemIds].filter((id) => solvedSet.has(id));
      const solvedCount = solvedInTag.length;
      const done = solvedCount >= LP_THRESHOLD;

      // completedAt = date of the 3rd solve (i.e. LP_THRESHOLD-th solve)
      let completedAt = null;
      if (done) {
        // Sort solved problems by when they were first passed
        const sortedSolves = solvedInTag
          .map((id) => firstPassDate[id])
          .filter(Boolean)
          .sort((a, b) => new Date(a) - new Date(b));
        completedAt = sortedSolves[LP_THRESHOLD - 1]
          ? new Date(sortedSolves[LP_THRESHOLD - 1]).toISOString()
          : null;
      }

      const current = !done && !foundCurrent;
      if (current) foundCurrent = true;

      return {
        label,
        done,
        current,
        completedAt,
        solvedCount,
        required: LP_THRESHOLD,
      };
    });

    const completedCount = topicsResult.filter((t) => t.done).length;

    const data = {
      topics: topicsResult,
      completedCount,
      totalCount: CURRICULUM.length,
    };
    cache.set(cacheKey, data, AGG_CACHE_TTL_SECONDS);
    return ok(res, "Learning path fetched", data);
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

/** @deprecated retained for existing callers */
const buildTagStats = (submissions) => {
  const tagStats = {};
  for (const s of submissions) {
    for (const tag of s.problem.tags) {
      if (!tagStats[tag]) tagStats[tag] = { attempted: new Set(), passed: new Set() };
      tagStats[tag].attempted.add(s.problemId);
      if (s.status === "PASSED") tagStats[tag].passed.add(s.problemId);
    }
  }
  return tagStats;
};

module.exports = {
  getUserStats,
  getUserActivity,
  getTopicStrength,
  getLearningPath,
  getUserSubscription,
  buildTagStats,
};
