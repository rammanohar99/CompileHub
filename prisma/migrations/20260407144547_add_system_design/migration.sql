-- CreateTable
CREATE TABLE "SystemDesignQuestion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT[],
    "constraints" TEXT[],
    "hints" TEXT[],
    "solution" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemDesignQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemDesignSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemDesignSubmission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SystemDesignSubmission" ADD CONSTRAINT "SystemDesignSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemDesignSubmission" ADD CONSTRAINT "SystemDesignSubmission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SystemDesignQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
