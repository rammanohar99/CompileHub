const prisma = require("../../../utils/prismaClient");

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds a Prisma `where` clause from optional query filters.
 * @param {{ difficulty?: string, search?: string }} filters
 */
function buildWhereClause({ difficulty, search }) {
  const where = {};

  if (difficulty) {
    where.difficulty = difficulty;
  }

  if (search && search.trim()) {
    // Case-insensitive full-text search across title and description
    where.OR = [
      { title: { contains: search.trim(), mode: "insensitive" } },
      { description: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  return where;
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Returns a paginated list of system design questions.
 * The solution field is intentionally excluded from the list view —
 * clients must fetch a single question by ID to get the full answer.
 *
 * @param {{ page: number, limit: number, difficulty?: string, search?: string }}
 * @returns {{ questions, total, page, limit, totalPages }}
 */
async function getAllQuestions({ page, limit, difficulty, search }) {
  const where = buildWhereClause({ difficulty, search });
  const skip = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    prisma.systemDesignQuestion.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      // Exclude solution & hints from the list — serve them only on detail view
      select: {
        id: true,
        title: true,
        difficulty: true,
        description: true,
        requirements: true,
        constraints: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.systemDesignQuestion.count({ where }),
  ]);

  return {
    questions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Returns a single question with the full solution and hints.
 * Throws 404 if no matching record found.
 *
 * @param {string} id - cuid
 */
async function getQuestionById(id) {
  const question = await prisma.systemDesignQuestion.findUnique({ where: { id } });

  if (!question) {
    const err = new Error("System design question not found");
    err.statusCode = 404;
    throw err;
  }

  return question;
}

/**
 * Creates a new system design question.
 * The `solution` object is persisted as a JSON column.
 *
 * @param {import('../validators').CreateQuestionSchema} data
 */
async function createQuestion(data) {
  const question = await prisma.systemDesignQuestion.create({ data });
  return question;
}

/**
 * Applies a partial update to a question.
 * Uses Prisma's `$set`-style update (only provided fields are changed).
 *
 * @param {string} id
 * @param {import('../validators').UpdateQuestionSchema} data
 */
async function updateQuestion(id, data) {
  // Check existence before updating so we return a clean 404
  const existing = await prisma.systemDesignQuestion.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    const err = new Error("System design question not found");
    err.statusCode = 404;
    throw err;
  }

  const question = await prisma.systemDesignQuestion.update({
    where: { id },
    data,
  });

  return question;
}

/**
 * Deletes a question and cascades to its submissions.
 *
 * @param {string} id
 */
async function deleteQuestion(id) {
  const existing = await prisma.systemDesignQuestion.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    const err = new Error("System design question not found");
    err.statusCode = 404;
    throw err;
  }

  // Delete submissions first (no cascade configured in schema)
  await prisma.systemDesignSubmission.deleteMany({ where: { questionId: id } });
  await prisma.systemDesignQuestion.delete({ where: { id } });
}

module.exports = { getAllQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion };
