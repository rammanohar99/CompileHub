/**
 * XP Service
 * All writes operate on a Prisma transaction client (tx) so callers can
 * compose them inside their own $transaction block.
 */

const XP_AMOUNTS = {
  CODE_SUBMISSION_PASS: 20,
  CODE_SUBMISSION_FAIL: 2,
  CODE_FIRST_SOLVE_BONUS: 50,
  SD_SUBMISSION: 15,
  DAILY_STREAK_BONUS: 10,
};

/**
 * Award XP for a list of reasons within an existing transaction.
 * Creates one XpTransaction row per reason and increments user.xp atomically.
 *
 * @param {object} tx - Prisma transaction client
 * @param {{ userId: string, reasons: string[], referenceId?: string }} opts
 * @returns {{ xpAwarded: number, newTotal: number }}
 */
async function awardXpInTx(tx, { userId, reasons, referenceId = null }) {
  if (!reasons.length) return { xpAwarded: 0, newTotal: 0 };

  const total = reasons.reduce((sum, r) => sum + (XP_AMOUNTS[r] ?? 0), 0);

  await tx.xpTransaction.createMany({
    data: reasons.map((reason) => ({
      userId,
      amount: XP_AMOUNTS[reason] ?? 0,
      reason,
      referenceId,
    })),
  });

  const updated = await tx.user.update({
    where: { id: userId },
    data: { xp: { increment: total } },
    select: { xp: true },
  });

  return { xpAwarded: total, newTotal: updated.xp };
}

/**
 * Returns true if the user has NO prior PASSED submission for this problem.
 * Call BEFORE the current submission is updated to PASSED.
 */
async function isFirstSolve(tx, userId, problemId) {
  const count = await tx.submission.count({
    where: { userId, problemId, status: "PASSED" },
  });
  return count === 0;
}

/**
 * Returns true if the user has NOT received a DAILY_STREAK_BONUS today (UTC).
 */
async function isFirstEventToday(tx, userId) {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const count = await tx.xpTransaction.count({
    where: {
      userId,
      reason: "DAILY_STREAK_BONUS",
      createdAt: { gte: todayStart, lt: tomorrowStart },
    },
  });
  return count === 0;
}

module.exports = { XP_AMOUNTS, awardXpInTx, isFirstSolve, isFirstEventToday };
