-- CreateEnum
CREATE TYPE "AssessmentQuestionType" AS ENUM ('MCQ', 'MULTI_SELECT', 'TRUE_FALSE', 'CODE_OUTPUT', 'SCENARIO_BASED');

-- CreateEnum
CREATE TYPE "AssessmentDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AssessmentAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "AssessmentReviewStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "AssessmentCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentTopic" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "topicId" TEXT,
    "questionType" "AssessmentQuestionType" NOT NULL,
    "difficulty" "AssessmentDifficulty" NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB NOT NULL,
    "explanation" TEXT,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "estimatedTimeSeconds" INTEGER NOT NULL DEFAULT 60,
    "metadata" JSONB,
    "reviewStatus" "AssessmentReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedAssessment" (
    "id" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "title" TEXT,
    "categoryId" TEXT,
    "config" JSONB NOT NULL,
    "estimatedDurationSecs" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedAssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedAssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "status" "AssessmentAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "answeredQuestions" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTimeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAnswerEvent" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selectedAnswer" JSONB,
    "isCorrect" BOOLEAN,
    "markedForReview" BOOLEAN NOT NULL DEFAULT false,
    "confidenceLevel" INTEGER,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAnswerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestionBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentQuestionBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCategory_slug_key" ON "AssessmentCategory"("slug");

-- CreateIndex
CREATE INDEX "AssessmentCategory_isActive_createdAt_idx" ON "AssessmentCategory"("isActive", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentTopic_categoryId_slug_key" ON "AssessmentTopic"("categoryId", "slug");

-- CreateIndex
CREATE INDEX "AssessmentTopic_categoryId_isActive_createdAt_idx" ON "AssessmentTopic"("categoryId", "isActive", "createdAt");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_categoryId_topicId_difficulty_questionType_idx" ON "AssessmentQuestion"("categoryId", "topicId", "difficulty", "questionType");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_isActive_reviewStatus_createdAt_idx" ON "AssessmentQuestion"("isActive", "reviewStatus", "createdAt");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_createdBy_createdAt_idx" ON "AssessmentQuestion"("createdBy", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedAssessment_generatedBy_createdAt_idx" ON "GeneratedAssessment"("generatedBy", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedAssessmentQuestion_assessmentId_questionId_key" ON "GeneratedAssessmentQuestion"("assessmentId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedAssessmentQuestion_assessmentId_sequence_key" ON "GeneratedAssessmentQuestion"("assessmentId", "sequence");

-- CreateIndex
CREATE INDEX "GeneratedAssessmentQuestion_questionId_idx" ON "GeneratedAssessmentQuestion"("questionId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_userId_createdAt_idx" ON "AssessmentAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_assessmentId_createdAt_idx" ON "AssessmentAttempt"("assessmentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAnswerEvent_attemptId_questionId_key" ON "AssessmentAnswerEvent"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "AssessmentAnswerEvent_userId_createdAt_idx" ON "AssessmentAnswerEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestionBookmark_userId_questionId_key" ON "AssessmentQuestionBookmark"("userId", "questionId");

-- CreateIndex
CREATE INDEX "AssessmentQuestionBookmark_questionId_idx" ON "AssessmentQuestionBookmark"("questionId");

-- AddForeignKey
ALTER TABLE "AssessmentTopic" ADD CONSTRAINT "AssessmentTopic_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssessmentCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssessmentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "AssessmentTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedAssessment" ADD CONSTRAINT "GeneratedAssessment_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedAssessment" ADD CONSTRAINT "GeneratedAssessment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssessmentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedAssessmentQuestion" ADD CONSTRAINT "GeneratedAssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "GeneratedAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedAssessmentQuestion" ADD CONSTRAINT "GeneratedAssessmentQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "GeneratedAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswerEvent" ADD CONSTRAINT "AssessmentAnswerEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswerEvent" ADD CONSTRAINT "AssessmentAnswerEvent_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnswerEvent" ADD CONSTRAINT "AssessmentAnswerEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestionBookmark" ADD CONSTRAINT "AssessmentQuestionBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestionBookmark" ADD CONSTRAINT "AssessmentQuestionBookmark_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
