/*
  Warnings:

  - You are about to drop the `ExportLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('NVIVO', 'UPLOADS', 'MEDIA');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('QUEUED', 'GENERATING', 'DONE', 'ERRORED');

-- DropForeignKey
ALTER TABLE "ExportLog" DROP CONSTRAINT "ExportLog_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ExportLog" DROP CONSTRAINT "ExportLog_userId_fkey";

-- DropTable
DROP TABLE "ExportLog";

-- CreateTable
CREATE TABLE "ProjectExport" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "observationsCount" INTEGER NOT NULL,
    "s3Path" TEXT,
    "type" "ExportType" NOT NULL,
    "status" "ExportStatus" NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "error" TEXT,
    "userId" INTEGER,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "ProjectExport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectExport" ADD CONSTRAINT "ProjectExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExport" ADD CONSTRAINT "ProjectExport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
