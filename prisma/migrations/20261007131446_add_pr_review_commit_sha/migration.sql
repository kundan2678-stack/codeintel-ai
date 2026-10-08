/*
  Warnings:

  - A unique constraint covering the columns `[pullRequestId,commitSha]` on the table `PRReview` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PRReview" ADD COLUMN     "commitSha" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PRReview_pullRequestId_commitSha_key" ON "PRReview"("pullRequestId", "commitSha");
