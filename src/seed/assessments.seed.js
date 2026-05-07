const { PrismaClient } = require("@prisma/client");
const categoriesData = require("./assessments/data");
const { SEED_TAG, buildCategoryQuestions } = require("./assessments/questionFactory");

const prisma = new PrismaClient();

async function ensureAdminUser() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@judge0.dev";
  const admin = await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true, email: true } });
  if (!admin) {
    throw new Error(`Seed admin user not found: ${adminEmail}. Run main seed first or set SEED_ADMIN_EMAIL.`);
  }
  return admin;
}

async function upsertCategoryAndTopics(categoryData) {
  const category = await prisma.assessmentCategory.upsert({
    where: { slug: categoryData.slug },
    update: {
      name: categoryData.name,
      description: categoryData.description,
      icon: categoryData.icon,
      isActive: true,
      deletedAt: null,
    },
    create: {
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description,
      icon: categoryData.icon,
      isActive: true,
    },
  });

  const topicIdsBySlug = new Map();
  for (const slug of categoryData.topics) {
    const topic = await prisma.assessmentTopic.upsert({
      where: { categoryId_slug: { categoryId: category.id, slug } },
      update: {
        name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: `${categoryData.name} topic: ${slug.replace(/-/g, " ")}`,
        isActive: true,
        deletedAt: null,
      },
      create: {
        categoryId: category.id,
        name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        slug,
        description: `${categoryData.name} topic: ${slug.replace(/-/g, " ")}`,
        isActive: true,
      },
    });
    topicIdsBySlug.set(slug, topic.id);
  }

  return { ...categoryData, id: category.id, topicIdsBySlug };
}

async function reseedCategoryQuestions(category, adminUserId) {
  await prisma.assessmentQuestion.deleteMany({
    where: {
      categoryId: category.id,
      createdBy: adminUserId,
      tags: { has: SEED_TAG },
    },
  });

  const questions = buildCategoryQuestions(category, category.topicIdsBySlug);

  for (const q of questions) {
    await prisma.assessmentQuestion.create({
      data: {
        categoryId: q.categoryId,
        topicId: q.topicId,
        questionType: q.questionType,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        tags: q.tags,
        isActive: q.isActive,
        estimatedTimeSeconds: q.estimatedTimeSeconds,
        metadata: q.metadata,
        reviewStatus: q.reviewStatus,
        createdBy: adminUserId,
      },
    });
  }

  return questions.length;
}

async function seedAssessments() {
  console.log("\nSeeding assessment engine data...");
  const admin = await ensureAdminUser();

  // Clear existing assessment attempts and generated assessments to avoid FK violations when reseeding questions
  await prisma.assessmentAnswerEvent.deleteMany({});
  await prisma.assessmentAttempt.deleteMany({});
  await prisma.generatedAssessmentQuestion.deleteMany({});
  await prisma.generatedAssessment.deleteMany({});

  let categoryCount = 0;
  let topicCount = 0;
  let questionCount = 0;

  for (const categoryData of categoriesData) {
    const category = await upsertCategoryAndTopics(categoryData);
    categoryCount += 1;
    topicCount += categoryData.topics.length;

    const created = await reseedCategoryQuestions(category, admin.id);
    questionCount += created;
    console.log(`  seeded ${categoryData.name}: ${categoryData.topics.length} topics, ${created} questions`);
  }

  console.log(`Assessment seed complete: ${categoryCount} categories, ${topicCount} topics, ${questionCount} questions`);
  return { categoryCount, topicCount, questionCount };
}

module.exports = { seedAssessments };

if (require.main === module) {
  seedAssessments()
    .catch((err) => {
      console.error("Assessment seed failed:", err);
      process.exit(1);
    })
    .finally(async () => prisma.$disconnect());
}
