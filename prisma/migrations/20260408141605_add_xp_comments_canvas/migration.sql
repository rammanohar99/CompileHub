-- CreateEnum
CREATE TYPE "XpReasonType" AS ENUM ('CODE_SUBMISSION_PASS', 'CODE_SUBMISSION_FAIL', 'CODE_FIRST_SOLVE_BONUS', 'SD_SUBMISSION', 'DAILY_STREAK_BONUS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "XpTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" "XpReasonType" NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdComment" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SdComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SdCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SdCanvasState" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nodesJson" TEXT NOT NULL,
    "edgesJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SdCanvasState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SdCommentLike_commentId_userId_key" ON "SdCommentLike"("commentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SdCanvasState_questionId_userId_key" ON "SdCanvasState"("questionId", "userId");

-- AddForeignKey
ALTER TABLE "XpTransaction" ADD CONSTRAINT "XpTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdComment" ADD CONSTRAINT "SdComment_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SystemDesignQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdComment" ADD CONSTRAINT "SdComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdCommentLike" ADD CONSTRAINT "SdCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "SdComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdCommentLike" ADD CONSTRAINT "SdCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdCanvasState" ADD CONSTRAINT "SdCanvasState_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SystemDesignQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SdCanvasState" ADD CONSTRAINT "SdCanvasState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
