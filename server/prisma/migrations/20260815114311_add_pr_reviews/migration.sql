-- CreateEnum
CREATE TYPE "ReviewVerdict" AS ENUM ('APPROVED', 'CHANGES_REQUESTED', 'COMMENT');

-- AlterTable
ALTER TABLE "deployments" ALTER COLUMN "environment" SET DEFAULT 'Production';

-- CreateTable
CREATE TABLE "pr_reviews" (
    "id" TEXT NOT NULL,
    "pullRequestId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 85,
    "verdict" "ReviewVerdict" NOT NULL DEFAULT 'COMMENT',
    "summary" TEXT NOT NULL,
    "securityAlerts" JSONB,
    "performanceNotes" JSONB,
    "codeSmells" JSONB,
    "rawDiff" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pr_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pr_reviews_pullRequestId_idx" ON "pr_reviews"("pullRequestId");

-- AddForeignKey
ALTER TABLE "pr_reviews" ADD CONSTRAINT "pr_reviews_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "pull_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
