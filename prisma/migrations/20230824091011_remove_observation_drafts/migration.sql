/*
  Warnings:

  - You are about to drop the `ObservationDraft` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ObservationDraft" DROP CONSTRAINT "ObservationDraft_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ObservationDraft" DROP CONSTRAINT "ObservationDraft_userId_fkey";

-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploadInProgress" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "ObservationDraft";
