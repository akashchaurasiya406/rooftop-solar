-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN');

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "city" TEXT,
    "rating" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "sample" BOOLEAN NOT NULL DEFAULT false,
    "ipHash" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_ipHash_createdAt_idx" ON "Feedback"("ipHash", "createdAt");

