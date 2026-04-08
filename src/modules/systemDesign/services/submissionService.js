const prisma = require("../../../utils/prismaClient");

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Creates a new submission for a system design question.
 * Validates that the target question actually exists before writing.
 *
 * @param {{ questionId: string, userId: string, answerText: string }}
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

  const submission = await prisma.systemDesignSubmission.create({
    data: { userId, questionId, answerText },
    // Return the submission with the basic question info attached
    include: {
      question: {
        select: { id: true, title: true, difficulty: true },
      },
    },
  });

  return submission;
}

/**
 * Returns all submissions by the authenticated user, paginated.
 * Includes basic question info (title, difficulty) to avoid extra round-trips.
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
        question: {
          select: { id: true, title: true, difficulty: true },
        },
      },
    }),
    prisma.systemDesignSubmission.count({ where: { userId } }),
  ]);

  return {
    submissions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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

  // Non-admins may only view their own submissions
  if (!isAdmin && submission.userId !== requestingUserId) {
    const err = new Error("You are not authorized to view this submission");
    err.statusCode = 403;
    throw err;
  }

  return submission;
}

module.exports = { submitAnswer, getUserSubmissions, getSubmissionById };
