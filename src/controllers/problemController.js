const prisma = require("../utils/prismaClient");
const { ok, created, notFound, badRequest } = require("../utils/apiResponse");
const { getUserPlan } = require("../middlewares/planMiddleware");
const { buildTagStats } = require("./userController");
const cache = require("../utils/cache");

// Plan → max problems per request
const PLAN_PROBLEM_LIMIT = { FREE: 10, BASIC: 50, PRO: 100, PREMIUM: 100 };
const DIFF_ORDER = { EASY: 0, MEDIUM: 1, HARD: 2 };

// GET /problems
// Query params: difficulty, company, tag, page, limit
const getProblems = async (req, res, next) => {
  try {
    const { difficulty, company, tag, page = 1, limit = 20 } = req.query;

    const where = {};
    if (difficulty) where.difficulty = difficulty.toUpperCase();
    if (company) where.companies = { has: company };
    if (tag) where.tags = { has: tag };

    // Plan-based limit cap
    const userPlan = await getUserPlan(req.user.id);
    const maxAllowed = PLAN_PROBLEM_LIMIT[userPlan] ?? 10;
    const take = Math.min(parseInt(limit), maxAllowed);
    const skip = (parseInt(page) - 1) * take;

    const cacheKey = `problems:${difficulty ?? ""}:${company ?? ""}:${tag ?? ""}:${page}:${take}`;
    const cached = cache.get(cacheKey);
    if (cached) return ok(res, "Problems fetched", cached);

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          difficulty: true,
          companies: true,
          tags: true,
          createdAt: true,
          _count: { select: { submissions: true } },
        },
      }),
      prisma.problem.count({ where }),
    ]);

    const data = {
      problems,
      pagination: { total, page: parseInt(page), limit: take, pages: Math.ceil(total / take) },
    };
    cache.set(cacheKey, data, 300); // 5 min TTL

    return ok(res, "Problems fetched", data);
  } catch (err) {
    next(err);
  }
};

// GET /problems/recommended?userId=&limit=
const getRecommendedProblems = async (req, res, next) => {
  try {
    const { userId, limit = 5 } = req.query;

    if (!userId) return badRequest(res, "userId query param is required");

    const cap = Math.min(parseInt(limit) || 5, 10);

    // Solved problem IDs
    const solved = await prisma.submission.findMany({
      where: { userId, status: "PASSED" },
      select: { problemId: true },
      distinct: ["problemId"],
    });
    const solvedIds = solved.map((s) => s.problemId);

    // All submissions for weak topic computation
    const allSubs = await prisma.submission.findMany({
      where: { userId },
      select: { problemId: true, status: true, problem: { select: { tags: true } } },
    });

    const tagStats = buildTagStats(allSubs);
    const weakTopics = Object.entries(tagStats)
      .map(([topic, { attempted, passed }]) => ({
        topic,
        score: Math.round((passed.size / attempted.size) * 100),
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((t) => t.topic);

    let problems = [];

    // Unsolved problems in weak topic areas
    if (weakTopics.length > 0) {
      const weakProblems = await prisma.problem.findMany({
        where: {
          id: { notIn: solvedIds },
          tags: { hasSome: weakTopics },
        },
        select: {
          id: true,
          title: true,
          difficulty: true,
          tags: true,
          companies: true,
          createdAt: true,
        },
      });
      // Sort EASY → MEDIUM → HARD in application code (enum order not alphabetical)
      weakProblems.sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty]);
      problems = weakProblems;
    }

    // Fill remaining slots with any unsolved EASY problems
    if (problems.length < cap) {
      const alreadySelected = problems.map((p) => p.id);
      const easyFill = await prisma.problem.findMany({
        where: {
          id: { notIn: [...solvedIds, ...alreadySelected] },
          difficulty: "EASY",
        },
        select: {
          id: true,
          title: true,
          difficulty: true,
          tags: true,
          companies: true,
          createdAt: true,
        },
        take: cap - problems.length,
      });
      problems = [...problems, ...easyFill];
    }

    return ok(res, "Recommended problems", { problems: problems.slice(0, cap) });
  } catch (err) {
    next(err);
  }
};

// GET /problems/:id
const getProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const problem = await prisma.problem.findUnique({
      where: { id },
      include: {
        testCases: {
          where: { isHidden: false }, // only expose public test cases
          select: { id: true, input: true, expectedOutput: true },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!problem) return notFound(res, "Problem not found");
    return ok(res, "Problem fetched", problem);
  } catch (err) {
    next(err);
  }
};

// POST /problems  (admin only)
const createProblem = async (req, res, next) => {
  try {
    const { title, description, difficulty, companies, tags } = req.body;

    const problem = await prisma.problem.create({
      data: { title, description, difficulty, companies, tags },
    });

    cache.delByPrefix("problems:"); // bust list cache

    return created(res, "Problem created", problem);
  } catch (err) {
    next(err);
  }
};

// POST /problems/:id/testcases  (admin only)
const addTestCases = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { testCases } = req.body;

    const problem = await prisma.problem.findUnique({ where: { id } });
    if (!problem) return notFound(res, "Problem not found");

    const created_cases = await prisma.$transaction(
      testCases.map((tc) =>
        prisma.testCase.create({
          data: {
            problemId: id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden ?? false,
          },
        })
      )
    );

    return created(res, `${created_cases.length} test case(s) added`, created_cases);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProblems, getProblem, getRecommendedProblems, createProblem, addTestCases };
