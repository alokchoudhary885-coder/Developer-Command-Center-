-- AlterTable
ALTER TABLE "issues" ADD COLUMN     "closedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pull_requests" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "mergedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "encryptedToken" TEXT;

-- CreateTable
CREATE TABLE "commits" (
    "id" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "author" TEXT,
    "authorAvatar" TEXT,
    "url" TEXT,
    "committedAt" TIMESTAMP(3),
    "repositoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commits_repositoryId_idx" ON "commits"("repositoryId");

-- CreateIndex
CREATE INDEX "commits_committedAt_idx" ON "commits"("committedAt");

-- CreateIndex
CREATE UNIQUE INDEX "commits_repositoryId_sha_key" ON "commits"("repositoryId", "sha");

-- AddForeignKey
ALTER TABLE "commits" ADD CONSTRAINT "commits_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
