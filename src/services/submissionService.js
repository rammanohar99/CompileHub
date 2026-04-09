const prisma = require("../utils/prismaClient");
const { runTestCase } = require("./judge0Service");
const { generateFeedback } = require("../utils/feedback");
const { awardXpInTx, isFirstSolve, isFirstEventToday } = require("./xpService");
const logger = require("../utils/logger");

/**
 * Full submission pipeline:
 *  1. Fetch problem + test cases
 *  2. Create a PENDING Submission record
 *  3. Run each test case against Judge0
 *  4. Store SubmissionResult per test case
 *  5. Determine overall status (PASSED / FAILED / ERROR)
 *  6. Generate and store Feedback on failure (PRO and PREMIUM users only)
 *  7. Update Submission, award XP, all in one transaction
 *
 * @param {string} userId
 * @param {string} problemId
 * @param {string} code
 * @param {number} languageId
 * @param {string} language
 * @param {string} userPlan  - "FREE" | "BASIC" | "PRO" | "PREMIUM"
 * @returns {Promise<Object>} populated submission with xpAwarded + newTotal
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

    // ── 7. Update submission + award XP atomically ─────────────────────
    // Determine XP reasons outside the transaction (read-only, no isolation needed)
    const reasons = [];
    if (finalStatus === "PASSED") {
      reasons.push("CODE_SUBMISSION_PASS");
      const firstSolve = await isFirstSolve(prisma, userId, problemId);
      if (firstSolve) reasons.push("CODE_FIRST_SOLVE_BONUS");
    } else {
      reasons.push("CODE_SUBMISSION_FAIL");
    }
    const streakNew = await isFirstEventToday(prisma, userId);
    if (streakNew) reasons.push("DAILY_STREAK_BONUS");

    const [updated, xpResult] = await prisma.$transaction(async (tx) => {
      const xp = await awardXpInTx(tx, { userId, reasons, referenceId: submission.id });

      const upd = await tx.submission.update({
        where: { id: submission.id },
        data: { status: finalStatus, executionTime: avgTime },
        include: {
          results: { include: { testCase: true } },
          feedback: true,
          problem: { select: { title: true, difficulty: true } },
        },
      });

      return [upd, xp];
    }, { timeout: 15000 });

    return { ...updated, xpAwarded: xpResult.xpAwarded, newTotal: xpResult.newTotal };
  } catch (err) {
    // Mark submission as ERROR so it's not stuck in RUNNING
    await prisma.submission
      .update({ where: { id: submission.id }, data: { status: "ERROR" } })
      .catch((e) => logger.error("Failed to mark submission as ERROR", e));

    throw err;
  }
};

/**
 * Streaming submission pipeline — same logic as processSubmission but
 * emits SSE events via the provided `emit` callback as each test case runs.
 *
 * Events emitted:
 *   init    — { testCases: [{ index, label, isHidden }] }
 *   running — { index }
 *   result  — { index, passed, executionTime, isHidden }
 *   done    — { submissionId, status, xpAwarded, newTotal, executionTime, feedback }
 *   error   — { message }
 *
 * @param {string}   userId
 * @param {string}   problemId
 * @param {string}   code
 * @param {number}   languageId
 * @param {string}   language
 * @param {string}   userPlan
 * @param {Function} emit  — (event: string, data: object) => void
 */
const processSubmissionStream = async (userId, problemId, code, languageId, language, userPlan = "FREE", emit) => {
  // ── 1. Fetch test cases ────────────────────────────────────────────────
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { testCases: true },
  });

  if (!problem) {
    emit("error", { message: "Problem not found" });
    return;
  }
  if (!problem.testCases.length) {
    emit("error", { message: "This problem has no test cases yet" });
    return;
  }

  // ── 2. Emit init — all test cases upfront (hidden ones masked) ─────────
  emit("init", {
    testCases: problem.testCases.map((tc, i) => ({
      index: i,
      label: tc.isHidden ? `Hidden Test Case ${i + 1}` : `Test Case ${i + 1}`,
      isHidden: tc.isHidden,
    })),
  });

  // ── 3. Create PENDING submission ──────────────────────────────────────
  const submission = await prisma.submission.create({
    data: { userId, problemId, code, languageId, language, status: "RUNNING" },
  });

  try {
    let allPassed = true;
    let totalTime = 0;
    let timeCount = 0;
    let firstFailure = null;

    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];

      emit("running", { index: i });

      const result = await runTestCase(code, languageId, tc.input, tc.expectedOutput);

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

      emit("result", {
        index: i,
        passed: result.passed,
        executionTime: result.executionTime,
        isHidden: tc.isHidden,
        // Only expose actual/expected for visible test cases
        ...(tc.isHidden
          ? {}
          : { actual: result.stdout, expected: tc.expectedOutput }),
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

    const finalStatus = allPassed ? "PASSED" : "FAILED";
    const avgTime = timeCount > 0 ? totalTime / timeCount : null;

    // ── Feedback ──────────────────────────────────────────────────────────
    const canReceiveFeedback = userPlan === "PRO" || userPlan === "PREMIUM";
    let feedbackMessage = null;
    if (!allPassed && firstFailure && canReceiveFeedback) {
      feedbackMessage = generateFeedback(firstFailure.actual, firstFailure.expected);
      await prisma.feedback.create({
        data: { submissionId: submission.id, message: feedbackMessage },
      });
    }

    // ── XP + final update ─────────────────────────────────────────────────
    const reasons = [];
    if (finalStatus === "PASSED") {
      reasons.push("CODE_SUBMISSION_PASS");
      const firstSolve = await isFirstSolve(prisma, userId, problemId);
      if (firstSolve) reasons.push("CODE_FIRST_SOLVE_BONUS");
    } else {
      reasons.push("CODE_SUBMISSION_FAIL");
    }
    const streakNew = await isFirstEventToday(prisma, userId);
    if (streakNew) reasons.push("DAILY_STREAK_BONUS");

    const [, xpResult] = await prisma.$transaction(async (tx) => {
      const xp = await awardXpInTx(tx, { userId, reasons, referenceId: submission.id });
      const upd = await tx.submission.update({
        where: { id: submission.id },
        data: { status: finalStatus, executionTime: avgTime },
      });
      return [upd, xp];
    }, { timeout: 15000 });

    emit("done", {
      submissionId: submission.id,
      status: finalStatus,
      executionTime: avgTime,
      xpAwarded: xpResult.xpAwarded,
      newTotal: xpResult.newTotal,
      feedback: feedbackMessage,
    });
  } catch (err) {
    await prisma.submission
      .update({ where: { id: submission.id }, data: { status: "ERROR" } })
      .catch((e) => logger.error("Failed to mark submission as ERROR", e));

    emit("error", { message: "Submission processing failed" });
    logger.error("processSubmissionStream error", err);
  }
};

module.exports = { processSubmission, processSubmissionStream };
