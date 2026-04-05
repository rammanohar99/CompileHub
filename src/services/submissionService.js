const prisma = require("../utils/prismaClient");
const { runTestCase } = require("./judge0Service");
const { generateFeedback } = require("../utils/feedback");
const logger = require("../utils/logger");

/**
 * Full submission pipeline:
 *  1. Fetch problem + test cases
 *  2. Create a PENDING Submission record
 *  3. Run each test case against Judge0
 *  4. Store SubmissionResult per test case
 *  5. Determine overall status (PASSED / FAILED / ERROR)
 *  6. Generate and store Feedback on failure (PRO and PREMIUM users only)
 *  7. Update Submission with final status + avg execution time
 *
 * @param {string} userId
 * @param {string} problemId
 * @param {string} code
 * @param {number} languageId
 * @param {string} language
 * @param {string} userPlan  - "FREE" | "BASIC" | "PRO" | "PREMIUM"
 * @returns {Promise<Object>} populated submission
 */
const processSubmission = async (userId, problemId, code, languageId, language, userPlan = "FREE") => {
  // ── 1. Fetch test cases ────────────────────────────────────────────────
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { testCases: true },
  });

  if (!problem) {
    const err = new Error("Problem not found");
    err.statusCode = 404;
    throw err;
  }

  if (!problem.testCases.length) {
    const err = new Error("This problem has no test cases yet");
    err.statusCode = 422;
    throw err;
  }

  // ── 2. Create PENDING submission ──────────────────────────────────────
  const submission = await prisma.submission.create({
    data: { userId, problemId, code, languageId, language, status: "PENDING" },
  });

  try {
    // ── 3. Run all test cases ──────────────────────────────────────────
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "RUNNING" },
    });

    let allPassed = true;
    let totalTime = 0;
    let timeCount = 0;
    let firstFailure = null;

    for (const tc of problem.testCases) {
      const result = await runTestCase(code, languageId, tc.input, tc.expectedOutput);

      // ── 4. Store per-test-case result ──────────────────────────────
      await prisma.submissionResult.create({
        data: {
          submissionId: submission.id,
          testCaseId: tc.id,
          stdout: result.stdout,
          expectedOutput: tc.expectedOutput,
          passed: result.passed,
          executionTime: result.executionTime,
        },
      });

      if (!result.passed && !firstFailure) {
        firstFailure = { actual: result.stdout, expected: tc.expectedOutput };
      }

      if (!result.passed) allPassed = false;

      if (result.executionTime !== null) {
        totalTime += result.executionTime;
        timeCount++;
      }
    }

    // ── 5. Final status ────────────────────────────────────────────────
    const finalStatus = allPassed ? "PASSED" : "FAILED";
    const avgTime = timeCount > 0 ? totalTime / timeCount : null;

    // ── 6. Feedback on failure — PRO and PREMIUM users only ────────────
    const canReceiveFeedback = userPlan === "PRO" || userPlan === "PREMIUM";
    if (!allPassed && firstFailure && canReceiveFeedback) {
      const message = generateFeedback(firstFailure.actual, firstFailure.expected);
      await prisma.feedback.create({
        data: { submissionId: submission.id, message },
      });
    }

    // ── 7. Update submission ───────────────────────────────────────────
    const updated = await prisma.submission.update({
      where: { id: submission.id },
      data: { status: finalStatus, executionTime: avgTime },
      include: {
        results: { include: { testCase: true } },
        feedback: true,
        problem: { select: { title: true, difficulty: true } },
      },
    });

    return updated;
  } catch (err) {
    // Mark submission as ERROR so it's not stuck in RUNNING
    await prisma.submission
      .update({ where: { id: submission.id }, data: { status: "ERROR" } })
      .catch((e) => logger.error("Failed to mark submission as ERROR", e));

    throw err;
  }
};

module.exports = { processSubmission };
