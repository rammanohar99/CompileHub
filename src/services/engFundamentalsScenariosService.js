const prisma = require("../utils/prismaClient");
const cache = require("../utils/cache");

// ── Helpers ───────────────────────────────────────────────────────────────────

function notFound(msg = "Scenario not found") {
  const err = new Error(msg);
  err.statusCode = 404;
  return err;
}

const VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

// ── Service functions ─────────────────────────────────────────────────────────

async function getAllScenarios({ userId, difficulty, page, limit }) {
  const where = { isPublished: true };
  if (difficulty) where.difficulty = difficulty;

  const skip = (page - 1) * limit;

  const scenariosCacheKey = `eng:scenarios:${difficulty || "all"}:${page}:${limit}`;
  let scenariosAndTotal = cache.get(scenariosCacheKey);

  if (!scenariosAndTotal) {
    const [scenarios, total] = await Promise.all([
      prisma.debugScenario.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      prisma.debugScenario.count({ where }),
    ]);
    scenariosAndTotal = { scenarios, total };
    cache.set(scenariosCacheKey, scenariosAndTotal, 300); // 5 min
  }

  const { scenarios, total } = scenariosAndTotal;

  const attempts = await prisma.userScenarioAttempt.findMany({
    where: { userId },
    select: { scenarioId: true, correct: true },
  });

  const attemptMap = new Map(attempts.map((a) => [a.scenarioId, a]));

  const items = scenarios.map((scenario) => {
    const attempt = attemptMap.get(scenario.id);
    const attempted = !!attempt;

    const base = {
      id: scenario.id,
      title: scenario.title,
      description: scenario.description,
      difficulty: scenario.difficulty,
      hypotheses: scenario.hypotheses,
      order: scenario.order,
      createdAt: scenario.createdAt,
      attempted,
      correct: attempted ? attempt.correct : null,
    };

    if (attempted) {
      base.correctIndex = scenario.correctIndex;
      base.explanation = scenario.explanation;
    }

    return base;
  });

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function submitAttempt(userId, scenarioId, picked) {
  const scenario = await prisma.debugScenario.findUnique({ where: { id: scenarioId } });
  if (!scenario) throw notFound();

  const hypotheses = scenario.hypotheses;
  if (!Array.isArray(hypotheses) || picked < 0 || picked >= hypotheses.length) {
    const err = new Error(`picked must be between 0 and ${hypotheses.length - 1}`);
    err.statusCode = 400;
    throw err;
  }

  const correct = picked === scenario.correctIndex;

  await prisma.userScenarioAttempt.upsert({
    where: { userId_scenarioId: { userId, scenarioId } },
    create: { userId, scenarioId, picked, correct },
    update: { picked, correct },
  });

  return { correct, correctIndex: scenario.correctIndex, explanation: scenario.explanation };
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

async function createScenario(data) {
  cache.delByPrefix("eng:scenarios:");
  if (!VALID_DIFFICULTIES.includes(data.difficulty)) {
    const err = new Error(`difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
  return prisma.debugScenario.create({ data });
}

async function updateScenario(id, data) {
  cache.delByPrefix("eng:scenarios:");
  const existing = await prisma.debugScenario.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound();

  if (data.difficulty && !VALID_DIFFICULTIES.includes(data.difficulty)) {
    const err = new Error(`difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  return prisma.debugScenario.update({ where: { id }, data });
}

async function deleteScenario(id) {
  cache.delByPrefix("eng:scenarios:");
  const existing = await prisma.debugScenario.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound();

  await prisma.debugScenario.delete({ where: { id } });
}

module.exports = {
  getAllScenarios,
  submitAttempt,
  createScenario,
  updateScenario,
  deleteScenario,
};
