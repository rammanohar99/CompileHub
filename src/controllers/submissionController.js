const { processSubmission, processSubmissionStream } = require("../services/submissionService");
const { getUserPlan } = require("../middlewares/planMiddleware");
const prisma = require("../utils/prismaClient");
const { ok, created, notFound, forbidden } = require("../utils/apiResponse");

// POST /submit
const submit = async (req, res, next) => {
  try {
    const { problemId, code, languageId, language } = req.body;
    const userId = req.user.id;

    const userPlan = await getUserPlan(userId);
    const submission = await processSubmission(userId, problemId, code, languageId, language, userPlan);
    return created(res, "Submission processed", submission);
  } catch (err) {
    next(err);
  }
};

// GET /submissions/:id
const getSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        results: {
          include: {
            testCase: { select: { input: true, isHidden: true } },
          },
        },
        feedback: true,
        problem: { select: { id: true, title: true, difficulty: true } },
        user: { select: { id: true, name: true } },
      },
    });

    if (!submission) return notFound(res, "Submission not found");

    // Non-admins can only view their own submissions
    if (req.user.role !== "ADMIN" && submission.userId !== req.user.id) {
      return forbidden(res, "You do not have access to this submission");
    }

    // Hide hidden test case inputs for non-admins
    if (req.user.role !== "ADMIN") {
      submission.results = submission.results.map((r) => ({
        ...r,
        testCase: r.testCase.isHidden ? { input: "[hidden]", isHidden: true } : r.testCase,
      }));
    }

    return ok(res, "Submission fetched", submission);
  } catch (err) {
    next(err);
  }
};

// GET /users/:userId/submissions
const getUserSubmissions = async (req, res, next) => {
  try {
    const id = req.params.userId ?? req.params.id;
    const { page = 1, limit = 20, problemId } = req.query;

    // Users can only view their own; admins can view anyone's
    if (req.user.role !== "ADMIN" && req.user.id !== id) {
      return forbidden(res, "You can only view your own submissions");
    }

    const where = { userId: id };
    if (problemId) where.problemId = problemId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          language: true,
          executionTime: true,
          createdAt: true,
          problem: { select: { id: true, title: true, difficulty: true } },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    return ok(res, "Submissions fetched", {
      submissions,
      pagination: { total, page: parseInt(page), limit: take, pages: Math.ceil(total / take) },
    });
  } catch (err) {
    next(err);
  }
};

// POST /submit/stream — SSE: streams test case results as they run
const streamSubmit = async (req, res, next) => {
  const { problemId, code, languageId, language } = req.body;
  const userId = req.user.id;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const emit = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Close SSE cleanly if client disconnects early
  req.on("close", () => res.end());

  try {
    const userPlan = await getUserPlan(userId);
    await processSubmissionStream(userId, problemId, code, languageId, language, userPlan, emit);
  } catch (err) {
    emit("error", { message: "Unexpected server error" });
  } finally {
    res.end();
  }
};

module.exports = { submit, getSubmission, getUserSubmissions, streamSubmit };
