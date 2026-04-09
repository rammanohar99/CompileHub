const prisma = require("../../../utils/prismaClient");
const { awardXpInTx, isFirstEventToday } = require("../../../services/xpService");

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Creates a new submission for a system design question and awards XP.
 * Validates that the target question actually exists before writing.
 *
 * @param {{ questionId: string, userId: string, answerText: string }}
 * @returns {{ submission, xpAwarded, newTotal }}
 */
async function submitAnswer({ questionId, userId, answerText }) {
  // Guard: question must exist
  const questionExists = await prisma.systemDesignQuestion.findUnique({
    where: { id: questionId },
    select: { id: true },
  });

  if (!questionExists) {
    const err = new Error("System design question not found");
    err.statusCode = 404;
    throw err;
  }

  const [submission, xpResult] = await prisma.$transaction(async (tx) => {
    const sub = await tx.systemDesignSubmission.create({
      data: { userId, questionId, answerText },
      include: {
        question: { select: { id: true, title: true, difficulty: true } },
      },
    });

    const reasons = ["SD_SUBMISSION"];
    const streakNew = await isFirstEventToday(tx, userId);
    if (streakNew) reasons.push("DAILY_STREAK_BONUS");

    const xp = await awardXpInTx(tx, { userId, reasons, referenceId: sub.id });

    return [sub, xp];
  });

  return { submission, xpAwarded: xpResult.xpAwarded, newTotal: xpResult.newTotal };
}

/**
 * Returns all submissions by the authenticated user, paginated.
 *
 * @param {{ userId: string, page: number, limit: number }}
 * @returns {{ submissions, total, page, limit, totalPages }}
 */
async function getUserSubmissions({ userId, page, limit }) {
  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    prisma.systemDesignSubmission.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        question: { select: { id: true, title: true, difficulty: true } },
      },
    }),
    prisma.systemDesignSubmission.count({ where: { userId } }),
  ]);

  return { submissions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Returns submissions for a specific question by the authenticated user, paginated.
 *
 * @param {{ questionId: string, userId: string, page: number, limit: number }}
 */
async function getQuestionSubmissions({ questionId, userId, page, limit }) {
  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    prisma.systemDesignSubmission.findMany({
      where: { userId, questionId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        answerText: true,
        createdAt: true,
      },
    }),
    prisma.systemDesignSubmission.count({ where: { userId, questionId } }),
  ]);

  return { submissions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Returns a single submission by ID.
 * Enforces ownership — only the author or an ADMIN can view.
 *
 * @param {{ submissionId: string, requestingUserId: string, isAdmin: boolean }}
 */
async function getSubmissionById({ submissionId, requestingUserId, isAdmin }) {
  const submission = await prisma.systemDesignSubmission.findUnique({
    where: { id: submissionId },
    include: {
      question: {
        select: { id: true, title: true, difficulty: true, description: true },
      },
    },
  });

  if (!submission) {
    const err = new Error("Submission not found");
    err.statusCode = 404;
    throw err;
  }

  if (!isAdmin && submission.userId !== requestingUserId) {
    const err = new Error("You are not authorized to view this submission");
    err.statusCode = 403;
    throw err;
  }

  return submission;
}

module.exports = { submitAnswer, getUserSubmissions, getQuestionSubmissions, getSubmissionById };
