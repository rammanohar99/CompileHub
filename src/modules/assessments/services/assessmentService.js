const prisma = require("../../../utils/prismaClient");
const cache = require("../../../utils/cache");
const logger = require("../../../utils/logger");
const { awardXpInTx, isFirstEventToday } = require("../../../services/xpService");

const parsePagination = (query, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const parseCsv = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\broll\s*out\b/g, "rollout")
    .replace(/\bstages?\b/g, "staged")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenSet = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return new Set();
  return new Set(normalized.split(" ").filter((t) => t.length > 1));
};

const hasPhrase = (haystack, phrase) => {
  const hTokens = tokenSet(haystack);
  const pTokens = tokenSet(phrase);
  if (!hTokens.size || !pTokens.size) return false;
  let hits = 0;
  pTokens.forEach((t) => {
    if (hTokens.has(t)) hits += 1;
  });
  return hits / pTokens.size >= 0.7;
};

const overlapScore = (answer, target) => {
  const a = tokenSet(answer);
  const b = tokenSet(target);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  b.forEach((token) => {
    if (a.has(token)) hits += 1;
  });
  return hits / b.size;
};

const computeScenarioCorrectness = (question, selectedAnswer) => {
  if (selectedAnswer == null) return null;
  const answerText = String(selectedAnswer);
  const expectedText = String(question.correctAnswer || "");

  // 1) Exact/near-exact match still counts.
  if (normalizeText(answerText) === normalizeText(expectedText)) return true;

  // 2) Prefer explicit rubric from metadata when provided.
  const rubric = question?.metadata?.evaluationRubric || {};
  const mustHave = Array.isArray(rubric.mustHave) ? rubric.mustHave : [];
  const niceToHave = Array.isArray(rubric.niceToHave) ? rubric.niceToHave : [];
  const threshold = typeof rubric.threshold === "number" ? rubric.threshold : 0.7;

  if (mustHave.length || niceToHave.length) {
    const mustHits = mustHave.reduce((acc, phrase) => (hasPhrase(answerText, phrase) ? acc + 1 : acc), 0);
    const niceHits = niceToHave.reduce((acc, phrase) => (hasPhrase(answerText, phrase) ? acc + 1 : acc), 0);
    const mustScore = mustHave.length ? mustHits / mustHave.length : 1;
    const niceScore = niceToHave.length ? niceHits / niceToHave.length : 0;
    const weighted = mustScore * 0.8 + niceScore * 0.2;
    return weighted >= threshold;
  }

  // 3) Backward-compatible fallback for old questions without rubric.
  // Requires strong concept overlap with expected answer phrase.
  return overlapScore(answerText, expectedText) >= 0.65;
};

const computeIsCorrect = (question, selectedAnswer) => {
  if (selectedAnswer == null) return null;

  if (question.questionType === "TRUE_FALSE" || question.questionType === "MCQ" || question.questionType === "CODE_OUTPUT") {
    return String(selectedAnswer) === String(question.correctAnswer);
  }

  if (question.questionType === "MULTI_SELECT") {
    const expected = Array.isArray(question.correctAnswer) ? [...question.correctAnswer].map(String).sort() : [];
    const picked = Array.isArray(selectedAnswer) ? [...selectedAnswer].map(String).sort() : [];
    return JSON.stringify(expected) === JSON.stringify(picked);
  }

  if (question.questionType === "SCENARIO_BASED") {
    return computeScenarioCorrectness(question, selectedAnswer);
  }

  return null;
};

const isValidSelectedAnswer = (question, selectedAnswer) => {
  if (selectedAnswer == null) return true;
  if (question.questionType === "MCQ" || question.questionType === "CODE_OUTPUT" || question.questionType === "SCENARIO_BASED") {
    return typeof selectedAnswer === "string";
  }
  if (question.questionType === "TRUE_FALSE") {
    return typeof selectedAnswer === "boolean";
  }
  if (question.questionType === "MULTI_SELECT") {
    return Array.isArray(selectedAnswer) && selectedAnswer.every((x) => typeof x === "string");
  }
  return false;
};

const pickSelectedAnswer = (payload = {}) => (
  payload.selectedAnswer ??
  payload.selectedOption ??
  payload.selectedOptions ??
  payload.answer ??
  payload.value
);

async function createCategory(data) {
  const created = await prisma.assessmentCategory.create({ data });
  cache.delByPrefix("assessment:categories:");
  return created;
}

async function listCategories({ includeInactive = false }) {
  const cacheKey = `assessment:categories:${includeInactive ? "all" : "active"}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const categories = await prisma.assessmentCategory.findMany({
    where: {
      deletedAt: null,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: { createdAt: "desc" },
  });

  cache.set(cacheKey, categories, 120);
  return categories;
}

async function getCategoryById(id) {
  return prisma.assessmentCategory.findFirst({ where: { id, deletedAt: null } });
}

async function updateCategory(id, data) {
  const updated = await prisma.assessmentCategory.update({ where: { id }, data });
  cache.delByPrefix("assessment:categories:");
  return updated;
}

async function softDeleteCategory(id) {
  await prisma.assessmentCategory.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  cache.delByPrefix("assessment:categories:");
}

async function createTopic(data) {
  const created = await prisma.assessmentTopic.create({ data });
  cache.delByPrefix("assessment:topics:");
  return created;
}

async function listTopicsByCategory(categoryId, { includeInactive = false }) {
  const cacheKey = `assessment:topics:${categoryId}:${includeInactive ? "all" : "active"}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const topics = await prisma.assessmentTopic.findMany({
    where: { categoryId, deletedAt: null, ...(includeInactive ? {} : { isActive: true }) },
    orderBy: { createdAt: "desc" },
  });

  cache.set(cacheKey, topics, 120);
  return topics;
}

async function updateTopic(id, data) {
  const updated = await prisma.assessmentTopic.update({ where: { id }, data });
  cache.delByPrefix("assessment:topics:");
  return updated;
}

async function deleteTopic(id) {
  await prisma.assessmentTopic.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  cache.delByPrefix("assessment:topics:");
}

async function createQuestion(data, userId) {
  if (data.topicId) {
    const topic = await prisma.assessmentTopic.findUnique({ where: { id: data.topicId }, select: { id: true, categoryId: true } });
    if (!topic || topic.categoryId !== data.categoryId) {
      const err = new Error("Selected topic does not belong to the provided category");
      err.statusCode = 400;
      throw err;
    }
  }

  const created = await prisma.assessmentQuestion.create({
    data: {
      ...data,
      createdBy: userId,
    },
  });
  cache.delByPrefix("assessment:questions:");
  return created;
}

async function bulkCreateQuestions(questions, userId) {
  for (const q of questions) {
    if (!q.topicId) continue;
    const topic = await prisma.assessmentTopic.findUnique({ where: { id: q.topicId }, select: { id: true, categoryId: true } });
    if (!topic || topic.categoryId !== q.categoryId) {
      const err = new Error("One or more questions have topic/category mismatch");
      err.statusCode = 400;
      throw err;
    }
  }

  const created = await prisma.$transaction(
    questions.map((q) => prisma.assessmentQuestion.create({ data: { ...q, createdBy: userId } }))
  );
  cache.delByPrefix("assessment:questions:");
  return created;
}

async function updateQuestion(id, data) {
  const existing = await prisma.assessmentQuestion.findUnique({
    where: { id },
    select: { id: true, categoryId: true, topicId: true },
  });

  if (!existing) {
    const err = new Error("Question not found");
    err.statusCode = 404;
    throw err;
  }

  const nextCategoryId = data.categoryId || existing.categoryId;
  const nextTopicId = Object.prototype.hasOwnProperty.call(data, "topicId") ? data.topicId : existing.topicId;

  if (nextTopicId) {
    const topic = await prisma.assessmentTopic.findUnique({ where: { id: nextTopicId }, select: { id: true, categoryId: true } });
    if (!topic || topic.categoryId !== nextCategoryId) {
      const err = new Error("Selected topic does not belong to the provided category");
      err.statusCode = 400;
      throw err;
    }
  }

  const updated = await prisma.assessmentQuestion.update({ where: { id }, data });
  cache.delByPrefix("assessment:questions:");
  return updated;
}

async function softDeleteQuestion(id) {
  await prisma.assessmentQuestion.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  cache.delByPrefix("assessment:questions:");
}

async function getQuestionById(id) {
  return prisma.assessmentQuestion.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      topic: { select: { id: true, name: true, slug: true } },
    },
  });
}

async function listQuestions(query) {
  const { page, limit, skip } = parsePagination(query);
  const tags = parseCsv(query.tags);
  const difficulties = parseCsv(query.difficulty);
  const questionTypes = parseCsv(query.questionType || query.questionTypes);

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  const where = {
    deletedAt: null,
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.topicId ? { topicId: query.topicId } : {}),
    ...(difficulties.length ? { difficulty: { in: difficulties } } : {}),
    ...(questionTypes.length ? { questionType: { in: questionTypes } } : {}),
    ...(tags.length ? { tags: { hasSome: tags } } : {}),
    ...(typeof query.active !== "undefined" ? { isActive: query.active === "true" } : {}),
    ...(query.search
      ? {
          OR: [
            { question: { contains: query.search, mode: "insensitive" } },
            { explanation: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const cacheKey = `assessment:questions:${JSON.stringify({ where, page, limit })}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const [questions, total] = await Promise.all([
    prisma.assessmentQuestion.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, name: true } },
        topic: { select: { id: true, name: true } },
      },
    }),
    prisma.assessmentQuestion.count({ where }),
  ]);

  const result = { questions, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  cache.set(cacheKey, result, 120);
  return result;
}

async function generateAssessment(config, userId) {
  const difficulties = Array.isArray(config.difficulty)
    ? config.difficulty
    : config.difficulty
      ? [config.difficulty]
      : ["EASY", "MEDIUM", "HARD"];

  const where = {
    deletedAt: null,
    isActive: true,
    reviewStatus: "APPROVED",
    questionType: { in: config.questionTypes },
    difficulty: { in: difficulties },
    ...(config.categoryId ? { categoryId: config.categoryId } : {}),
    ...(config.topics?.length ? { topicId: { in: config.topics } } : {}),
  };

  const totalAvailable = await prisma.assessmentQuestion.count({ where });
  if (totalAvailable < config.questionCount) {
    const err = new Error(`Not enough questions available. Requested ${config.questionCount}, found ${totalAvailable}`);
    err.statusCode = 400;
    throw err;
  }

  const pickRandomIds = async (baseWhere, takeCount, excludedIds) => {
    const sampled = [];
    let guard = 0;
    while (sampled.length < takeCount && guard < takeCount * 6) {
      guard += 1;
      const count = await prisma.assessmentQuestion.count({
        where: { ...baseWhere, id: { notIn: [...excludedIds, ...sampled] } },
      });
      if (count <= 0) break;
      const randomOffset = Math.floor(Math.random() * count);
      const row = await prisma.assessmentQuestion.findFirst({
        where: { ...baseWhere, id: { notIn: [...excludedIds, ...sampled] } },
        skip: randomOffset,
        select: { id: true },
      });
      if (row?.id) sampled.push(row.id);
    }
    return sampled;
  };

  const perBucket = Math.floor(config.questionCount / difficulties.length);
  const pickedIds = new Set();
  for (const d of difficulties) {
    const ids = await pickRandomIds({ ...where, difficulty: d }, perBucket, pickedIds);
    ids.forEach((id) => pickedIds.add(id));
  }

  const remaining = config.questionCount - pickedIds.size;
  if (remaining > 0) {
    const ids = await pickRandomIds(where, remaining, pickedIds);
    ids.forEach((id) => pickedIds.add(id));
  }

  if (pickedIds.size < config.questionCount) {
    const err = new Error("Not enough unique questions for requested distribution");
    err.statusCode = 400;
    throw err;
  }

  const selected = await prisma.assessmentQuestion.findMany({
    where: { id: { in: Array.from(pickedIds).slice(0, config.questionCount) } },
    select: { id: true, estimatedTimeSeconds: true },
  });

  const orderedIds = Array.from(pickedIds).slice(0, config.questionCount);
  const estimatedDurationSecs = selected.reduce((sum, q) => sum + (q.estimatedTimeSeconds || 60), 0);

  const generated = await prisma.generatedAssessment.create({
    data: {
      generatedBy: userId,
      title: config.title || null,
      categoryId: config.categoryId || null,
      config,
      estimatedDurationSecs,
      questionCount: orderedIds.length,
      questions: {
        create: orderedIds.map((id, idx) => ({ questionId: id, sequence: idx + 1 })),
      },
    },
    include: {
      questions: {
        orderBy: { sequence: "asc" },
        include: {
          question: {
            include: {
              category: { select: { id: true, name: true } },
              topic: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  logger.info(`[Assessments] Generated assessment ${generated.id} by user ${userId} with ${generated.questionCount} questions`);

  return {
    assessment: {
      id: generated.id,
      title: generated.title,
      categoryId: generated.categoryId,
      config: generated.config,
      createdAt: generated.createdAt,
    },
    metadata: {
      questionCount: generated.questionCount,
      estimatedDurationSecs,
      timedMode: !!config.timedMode,
    },
    questions: generated.questions.map((q) => ({
      sequence: q.sequence,
      ...q.question,
    })),
  };
}

async function startAttempt(assessmentId, userId) {
  const generated = await prisma.generatedAssessment.findUnique({
    where: { id: assessmentId },
    include: { questions: { select: { questionId: true } } },
  });

  if (!generated) {
    const err = new Error("Assessment not found");
    err.statusCode = 404;
    throw err;
  }

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      userId,
      assessmentId,
      totalQuestions: generated.questions.length,
    },
    include: {
      assessment: {
        select: {
          id: true,
          estimatedDurationSecs: true,
          config: true,
        },
      },
    },
  });
  logger.info(`[Assessments] Attempt started ${attempt.id} by user ${userId} for assessment ${assessmentId}`);
  return attempt;
}

async function saveAnswer(attemptId, userId, payload) {
  const normalizedSelectedAnswer = pickSelectedAnswer(payload);
  const normalizedPayload = {
    ...payload,
    ...(Object.prototype.hasOwnProperty.call(payload, "selectedAnswer") ||
    Object.prototype.hasOwnProperty.call(payload, "selectedOption") ||
    Object.prototype.hasOwnProperty.call(payload, "selectedOptions") ||
    Object.prototype.hasOwnProperty.call(payload, "answer") ||
    Object.prototype.hasOwnProperty.call(payload, "value")
      ? { selectedAnswer: normalizedSelectedAnswer }
      : {}),
  };

  const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) {
    const err = new Error("Attempt not found");
    err.statusCode = 404;
    throw err;
  }
  if (attempt.status !== "IN_PROGRESS") {
    const err = new Error("Attempt is already closed");
    err.statusCode = 400;
    throw err;
  }

  const belongs = await prisma.generatedAssessmentQuestion.findFirst({
    where: { assessmentId: attempt.assessmentId, questionId: normalizedPayload.questionId },
    select: { id: true },
  });
  if (!belongs) {
    const err = new Error("Question does not belong to this assessment attempt");
    err.statusCode = 400;
    throw err;
  }

  const question = await prisma.assessmentQuestion.findUnique({ where: { id: normalizedPayload.questionId } });
  if (!question || question.deletedAt) {
    const err = new Error("Question not found");
    err.statusCode = 404;
    throw err;
  }

  if (
    Object.prototype.hasOwnProperty.call(normalizedPayload, "selectedAnswer") &&
    !isValidSelectedAnswer(question, normalizedPayload.selectedAnswer)
  ) {
    const err = new Error(`Invalid selectedAnswer type for question type ${question.questionType}`);
    err.statusCode = 400;
    throw err;
  }

  const isCorrect = computeIsCorrect(question, normalizedPayload.selectedAnswer);

  const answer = await prisma.$transaction(async (tx) => {
    const updateData = {
      ...(Object.prototype.hasOwnProperty.call(normalizedPayload, "selectedAnswer")
        ? { selectedAnswer: normalizedPayload.selectedAnswer }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(normalizedPayload, "markedForReview")
        ? { markedForReview: normalizedPayload.markedForReview }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(normalizedPayload, "confidenceLevel")
        ? { confidenceLevel: normalizedPayload.confidenceLevel }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(normalizedPayload, "isFinal") ? { isFinal: normalizedPayload.isFinal } : {}),
      ...(Object.prototype.hasOwnProperty.call(normalizedPayload, "selectedAnswer") ? { isCorrect } : {}),
      ...(normalizedPayload.timeSpentSeconds ? { timeSpentSeconds: { increment: normalizedPayload.timeSpentSeconds } } : {}),
    };

    const saved = await tx.assessmentAnswerEvent.upsert({
      where: { attemptId_questionId: { attemptId, questionId: normalizedPayload.questionId } },
      update: updateData,
      create: {
        attemptId,
        questionId: normalizedPayload.questionId,
        userId,
        selectedAnswer: normalizedPayload.selectedAnswer ?? null,
        markedForReview: normalizedPayload.markedForReview ?? false,
        confidenceLevel: normalizedPayload.confidenceLevel ?? null,
        timeSpentSeconds: normalizedPayload.timeSpentSeconds ?? 0,
        isFinal: normalizedPayload.isFinal ?? false,
        isCorrect,
      },
    });

    const answeredQuestions = await tx.assessmentAnswerEvent.count({ where: { attemptId } });
    await tx.assessmentAttempt.update({ where: { id: attemptId }, data: { answeredQuestions } });
    return saved;
  });

  return answer;
}

async function saveProgress(attemptId, userId, metadata) {
  const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) {
    const err = new Error("Attempt not found");
    err.statusCode = 404;
    throw err;
  }
  if (attempt.status !== "IN_PROGRESS") {
    const err = new Error("Attempt is already closed");
    err.statusCode = 400;
    throw err;
  }
  return prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: { metadata },
    include: {
      assessment: {
        select: {
          id: true,
          estimatedDurationSecs: true,
          config: true,
        },
      },
    },
  });
}

async function finishAttempt(attemptId, userId) {
  const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) {
    const err = new Error("Attempt not found");
    err.statusCode = 404;
    throw err;
  }

  if (attempt.status === "COMPLETED") {
    return { ...attempt, correctAnswers: Math.round(attempt.score || 0), xpAwarded: 0, newTotal: null };
  }

  let answers = await prisma.assessmentAnswerEvent.findMany({ where: { attemptId } });

  // Backward-compatibility: some clients only persist answers in attempt.metadata.answers.
  if (answers.length === 0 && Array.isArray(attempt.metadata?.answers) && attempt.metadata.answers.length > 0) {
    const allowedQuestionIds = await prisma.generatedAssessmentQuestion.findMany({
      where: { assessmentId: attempt.assessmentId },
      select: { questionId: true },
    });
    const allowedSet = new Set(allowedQuestionIds.map((row) => row.questionId));
    const questions = await prisma.assessmentQuestion.findMany({
      where: { id: { in: Array.from(allowedSet) }, deletedAt: null },
    });
    const questionById = new Map(questions.map((q) => [q.id, q]));

    for (const raw of attempt.metadata.answers) {
      if (!raw || typeof raw !== "object") continue;
      const questionId = raw.questionId;
      if (!questionId || !allowedSet.has(questionId)) continue;

      const question = questionById.get(questionId);
      if (!question) continue;

      const selectedAnswer = pickSelectedAnswer(raw);
      if (!isValidSelectedAnswer(question, selectedAnswer)) continue;

      const isCorrect = computeIsCorrect(question, selectedAnswer);

      await prisma.assessmentAnswerEvent.upsert({
        where: { attemptId_questionId: { attemptId, questionId } },
        update: {
          ...(Object.prototype.hasOwnProperty.call(raw, "timeSpentSeconds")
            ? { timeSpentSeconds: raw.timeSpentSeconds || 0 }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(raw, "markedForReview")
            ? { markedForReview: !!raw.markedForReview }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(raw, "confidenceLevel")
            ? { confidenceLevel: raw.confidenceLevel }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(raw, "isFinal") ? { isFinal: !!raw.isFinal } : {}),
          ...(selectedAnswer !== undefined ? { selectedAnswer, isCorrect } : {}),
        },
        create: {
          attemptId,
          questionId,
          userId,
          selectedAnswer: selectedAnswer ?? null,
          isCorrect,
          markedForReview: !!raw.markedForReview,
          confidenceLevel: raw.confidenceLevel ?? null,
          timeSpentSeconds: raw.timeSpentSeconds || 0,
          isFinal: !!raw.isFinal,
        },
      });
    }

    answers = await prisma.assessmentAnswerEvent.findMany({ where: { attemptId } });
  }
  const correct = answers.filter((a) => a.isCorrect === true).length;
  const answered = answers.length;
  const accuracy = answered > 0 ? (correct / answered) * 100 : 0;
  const score = correct;
  const totalTimeSpentSeconds = answers.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0);

  const endedAt = new Date();
  const updated = await prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      status: "COMPLETED",
      endedAt,
      answeredQuestions: answered,
      score,
      accuracy,
      totalTimeSpentSeconds,
    },
  });

  // Award XP for completing the assessment + daily streak bonus if first event today
  const xpReasons = ["ASSESSMENT_COMPLETION"];
  const streakNew = await isFirstEventToday(prisma, userId);
  if (streakNew) xpReasons.push("DAILY_STREAK_BONUS");

  const xpResult = await prisma.$transaction(async (tx) => {
    return awardXpInTx(tx, { userId, reasons: xpReasons, referenceId: attemptId });
  });

  logger.info(`[Assessments] Attempt finished ${attemptId} by user ${userId} score=${score} accuracy=${accuracy.toFixed(2)} xpAwarded=${xpResult.xpAwarded}`);

  return { ...updated, correctAnswers: correct, xpAwarded: xpResult.xpAwarded, newTotal: xpResult.newTotal };
}

async function getAttemptResult(attemptId, userId) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: {
        include: {
          questions: {
            orderBy: { sequence: "asc" },
            include: { question: true },
          },
        },
      },
      answerEvents: true,
    },
  });

  if (!attempt || attempt.userId !== userId) {
    const err = new Error("Attempt not found");
    err.statusCode = 404;
    throw err;
  }

  return attempt;
}

async function listAttemptHistory(userId, query) {
  const { page, limit, skip } = parsePagination(query);

  const [rawAttempts, total] = await Promise.all([
    prisma.assessmentAttempt.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            questionCount: true,
            estimatedDurationSecs: true,
            config: true,
            categoryId: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.assessmentAttempt.count({ where: { userId } }),
  ]);

  const attempts = rawAttempts.map((a) => ({
    id: a.id,
    assessmentId: a.assessmentId,
    assessmentTitle: a.assessment?.title || null,
    category: a.assessment?.category?.name || null,
    categoryId: a.assessment?.categoryId || null,
    status: a.status,
    score: a.score,
    accuracy: a.accuracy,
    totalPoints: a.totalQuestions,   // total questions = max possible score
    totalQuestions: a.totalQuestions,
    answeredQuestions: a.answeredQuestions,
    totalTimeSpentSeconds: a.totalTimeSpentSeconds,
    startedAt: a.startedAt.toISOString(),
    completedAt: a.endedAt ? a.endedAt.toISOString() : null,  // null when IN_PROGRESS
    createdAt: a.createdAt.toISOString(),
  }));

  return { attempts, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
}

async function getAttemptAnalytics(attemptId, userId) {
  const attempt = await getAttemptResult(attemptId, userId);
  const answersByQ = new Map(attempt.answerEvents.map((a) => [a.questionId, a]));

  const topicAgg = new Map();
  const diffAgg = new Map();

  for (const item of attempt.assessment.questions) {
    const q = item.question;
    const ans = answersByQ.get(q.id);
    const topicKey = q.topicId || "uncategorized";
    const diffKey = q.difficulty;

    if (!topicAgg.has(topicKey)) topicAgg.set(topicKey, { total: 0, correct: 0, time: 0 });
    if (!diffAgg.has(diffKey)) diffAgg.set(diffKey, { total: 0, correct: 0, time: 0 });

    topicAgg.get(topicKey).total += 1;
    diffAgg.get(diffKey).total += 1;

    if (ans) {
      if (ans.isCorrect) {
        topicAgg.get(topicKey).correct += 1;
        diffAgg.get(diffKey).correct += 1;
      }
      topicAgg.get(topicKey).time += ans.timeSpentSeconds || 0;
      diffAgg.get(diffKey).time += ans.timeSpentSeconds || 0;
    }
  }

  const topicBreakdown = Array.from(topicAgg.entries()).map(([topicId, v]) => ({
    topicId,
    accuracy: v.total ? (v.correct / v.total) * 100 : 0,
    total: v.total,
    correct: v.correct,
    timeSpentSeconds: v.time,
  }));

  const difficultyBreakdown = Array.from(diffAgg.entries()).map(([difficulty, v]) => ({
    difficulty,
    accuracy: v.total ? (v.correct / v.total) * 100 : 0,
    total: v.total,
    correct: v.correct,
    timeSpentSeconds: v.time,
  }));

  return {
    attemptId: attempt.id,
    score: attempt.score,
    accuracy: attempt.accuracy,
    totalTimeSpentSeconds: attempt.totalTimeSpentSeconds,
    topicBreakdown,
    difficultyBreakdown,
    weakAreas: topicBreakdown.filter((t) => t.accuracy < 50),
    strongAreas: topicBreakdown.filter((t) => t.accuracy >= 80),
  };
}

async function getUserPerformanceSummary(userId) {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      assessment: {
        select: { id: true, title: true, categoryId: true, questionCount: true, config: true },
      },
    },
  });

  const totalAttempts = attempts.length;
  const averageScore = totalAttempts
    ? Math.round(attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / totalAttempts * 10) / 10
    : 0;
  const perfectScores = attempts.filter((a) => a.accuracy === 100).length;
  const totalTimeSpentSeconds = attempts.reduce((sum, a) => sum + (a.totalTimeSpentSeconds || 0), 0);

  // categoryBreakdown: keyed by categoryId (or "uncategorized")
  const catMap = new Map();
  for (const a of attempts) {
    const key = a.assessment?.categoryId || "uncategorized";
    if (!catMap.has(key)) catMap.set(key, { attempts: 0, totalAccuracy: 0 });
    const entry = catMap.get(key);
    entry.attempts += 1;
    entry.totalAccuracy += a.accuracy || 0;
  }
  const categoryBreakdown = {};
  for (const [key, v] of catMap.entries()) {
    categoryBreakdown[key] = {
      attempts: v.attempts,
      averageScore: Math.round((v.totalAccuracy / v.attempts) * 10) / 10,
    };
  }

  const recentAttempts = attempts.slice(0, 10).map((a) => ({
    id: a.id,
    assessmentId: a.assessmentId,
    assessmentTitle: a.assessment?.title || null,
    category: a.assessment?.categoryId || null,
    status: a.status,
    score: a.score,
    accuracy: a.accuracy,
    totalQuestions: a.totalQuestions,
    answeredQuestions: a.answeredQuestions,
    totalTimeSpentSeconds: a.totalTimeSpentSeconds,
    startedAt: a.startedAt.toISOString(),
    completedAt: a.endedAt ? a.endedAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }));

  return {
    totalAttempts,
    averageScore,
    perfectScores,
    totalTimeSpentSeconds,
    categoryBreakdown,
    recentAttempts,
  };
}

async function addBookmark(userId, questionId) {
  return prisma.assessmentQuestionBookmark.upsert({
    where: { userId_questionId: { userId, questionId } },
    update: {},
    create: { userId, questionId },
  });
}

async function removeBookmark(userId, questionId) {
  await prisma.assessmentQuestionBookmark.deleteMany({ where: { userId, questionId } });
}

async function listBookmarks(userId, query) {
  const { page, limit, skip } = parsePagination(query);
  const [bookmarks, total] = await Promise.all([
    prisma.assessmentQuestionBookmark.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        question: {
          include: {
            category: { select: { id: true, name: true } },
            topic: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.assessmentQuestionBookmark.count({ where: { userId } }),
  ]);

  return { bookmarks, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
}

async function setQuestionsActiveState(questionIds, isActive) {
  const result = await prisma.assessmentQuestion.updateMany({
    where: { id: { in: questionIds }, deletedAt: null },
    data: { isActive },
  });
  logger.info(`[Assessments] Admin updated active state for ${result.count} questions -> ${isActive}`);
  return result;
}

async function setQuestionReviewStatus(id, reviewStatus) {
  const updated = await prisma.assessmentQuestion.update({ where: { id }, data: { reviewStatus } });
  logger.info(`[Assessments] Admin changed review status for question ${id} -> ${reviewStatus}`);
  return updated;
}

async function exportQuestions(query) {
  const data = await listQuestions({ ...query, page: 1, limit: 1000 });
  return data.questions;
}

module.exports = {
  createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  softDeleteCategory,
  createTopic,
  listTopicsByCategory,
  updateTopic,
  deleteTopic,
  createQuestion,
  bulkCreateQuestions,
  updateQuestion,
  softDeleteQuestion,
  getQuestionById,
  listQuestions,
  generateAssessment,
  startAttempt,
  saveAnswer,
  saveProgress,
  finishAttempt,
  getAttemptResult,
  listAttemptHistory,
  getAttemptAnalytics,
  getUserPerformanceSummary,
  addBookmark,
  removeBookmark,
  listBookmarks,
  setQuestionsActiveState,
  setQuestionReviewStatus,
  exportQuestions,
};
