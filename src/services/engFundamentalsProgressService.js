const prisma = require("../utils/prismaClient");

async function getProgress(userId) {
  const [
    totalTopics,
    completedProgress,
    totalScenarios,
    scenarioAttempts,
    totalSessions,
    lastSession,
    totalTemplates,
    templateViews,
  ] = await Promise.all([
    prisma.fundamentalTopic.count({ where: { isPublished: true } }),
    prisma.userTopicProgress.findMany({
      where: { userId },
      select: { topicId: true },
    }),
    prisma.debugScenario.count({ where: { isPublished: true } }),
    prisma.userScenarioAttempt.findMany({
      where: { userId },
      include: { scenario: { select: { difficulty: true } } },
    }),
    prisma.projectPrepSession.count({ where: { userId } }),
    prisma.projectPrepSession.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    }),
    prisma.commTemplate.count({ where: { isPublished: true } }),
    prisma.userTemplateView.findMany({
      where: { userId },
      select: { templateId: true },
    }),
  ]);

  const completedIds = completedProgress.map((p) => p.topicId);

  const byDifficulty = {
    EASY: { attempted: 0, solved: 0 },
    MEDIUM: { attempted: 0, solved: 0 },
    HARD: { attempted: 0, solved: 0 },
  };

  for (const attempt of scenarioAttempts) {
    const diff = attempt.scenario.difficulty;
    if (byDifficulty[diff]) {
      byDifficulty[diff].attempted += 1;
      if (attempt.correct) byDifficulty[diff].solved += 1;
    }
  }

  const attempted = scenarioAttempts.length;
  const solved = scenarioAttempts.filter((a) => a.correct).length;

  const viewedIds = templateViews.map((v) => v.templateId);

  return {
    fundamentals: {
      totalTopics,
      completedTopics: completedIds.length,
      completedIds,
    },
    debugging: {
      totalScenarios,
      attempted,
      solved,
      byDifficulty,
    },
    projectPrep: {
      totalSessions,
      lastSession,
    },
    communication: {
      totalTemplates,
      viewed: viewedIds.length,
      viewedIds,
    },
  };
}

module.exports = { getProgress };
