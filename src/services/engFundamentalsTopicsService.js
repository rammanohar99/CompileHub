const prisma = require("../utils/prismaClient");
const cache = require("../utils/cache");

// ── Helpers ───────────────────────────────────────────────────────────────────

function notFound(msg = "Topic not found") {
  const err = new Error(msg);
  err.statusCode = 404;
  return err;
}

const TOPIC_INCLUDE = {
  concepts: { orderBy: { order: "asc" } },
  qna: { orderBy: { order: "asc" } },
  quiz: { orderBy: { order: "asc" } },
};

// ── Service functions ─────────────────────────────────────────────────────────

async function getAllTopics(userId) {
  const topicsCacheKey = "eng:topics:published";
  let topics = cache.get(topicsCacheKey);

  if (!topics) {
    topics = await prisma.fundamentalTopic.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      include: TOPIC_INCLUDE,
    });
    cache.set(topicsCacheKey, topics, 300); // 5 min
  }

  const completedProgress = await prisma.userTopicProgress.findMany({
    where: { userId },
    select: { topicId: true },
  });

  const completedTopicIds = completedProgress.map((p) => p.topicId);
  return { topics, completedTopicIds };
}

async function getTopicById(id) {
  const topic = await prisma.fundamentalTopic.findUnique({
    where: { id },
    include: TOPIC_INCLUDE,
  });

  if (!topic) throw notFound();
  return topic;
}

async function completeTopic(userId, topicId) {
  const topic = await prisma.fundamentalTopic.findUnique({
    where: { id: topicId },
    select: { id: true },
  });
  if (!topic) throw notFound();

  const progress = await prisma.userTopicProgress.upsert({
    where: { userId_topicId: { userId, topicId } },
    create: { userId, topicId },
    update: { completedAt: new Date() },
  });

  return { completed: true, topicId: progress.topicId, completedAt: progress.completedAt };
}

async function uncompleteTopic(userId, topicId) {
  const existing = await prisma.userTopicProgress.findUnique({
    where: { userId_topicId: { userId, topicId } },
  });
  if (!existing) throw notFound("Completion record not found");

  await prisma.userTopicProgress.delete({
    where: { userId_topicId: { userId, topicId } },
  });
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

async function createTopic({ concepts = [], qna = [], quiz = [], ...topicData }) {
  cache.del("eng:topics:published");
  const topic = await prisma.fundamentalTopic.create({
    data: {
      ...topicData,
      concepts: { create: concepts.map((c, i) => ({ ...c, order: c.order ?? i })) },
      qna: { create: qna.map((q, i) => ({ ...q, order: q.order ?? i })) },
      quiz: { create: quiz.map((q, i) => ({ ...q, order: q.order ?? i })) },
    },
    include: TOPIC_INCLUDE,
  });
  return topic;
}

async function updateTopic(id, { concepts, qna, quiz, ...topicData }) {
  const existing = await prisma.fundamentalTopic.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw notFound();

  cache.del("eng:topics:published");
  const topic = await prisma.fundamentalTopic.update({
    where: { id },
    data: topicData,
  });

  if (concepts !== undefined) {
    await prisma.topicConcept.deleteMany({ where: { topicId: id } });
    await prisma.topicConcept.createMany({
      data: concepts.map((c, i) => ({ ...c, topicId: id, order: c.order ?? i })),
    });
  }
  if (qna !== undefined) {
    await prisma.topicQnA.deleteMany({ where: { topicId: id } });
    await prisma.topicQnA.createMany({
      data: qna.map((q, i) => ({ ...q, topicId: id, order: q.order ?? i })),
    });
  }
  if (quiz !== undefined) {
    await prisma.topicQuiz.deleteMany({ where: { topicId: id } });
    await prisma.topicQuiz.createMany({
      data: quiz.map((q, i) => ({ ...q, topicId: id, order: q.order ?? i })),
    });
  }

  return prisma.fundamentalTopic.findUnique({ where: { id }, include: TOPIC_INCLUDE });
}

async function deleteTopic(id) {
  const existing = await prisma.fundamentalTopic.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw notFound();

  cache.del("eng:topics:published");
  await prisma.fundamentalTopic.delete({ where: { id } });
}

module.exports = {
  getAllTopics,
  getTopicById,
  completeTopic,
  uncompleteTopic,
  createTopic,
  updateTopic,
  deleteTopic,
};
