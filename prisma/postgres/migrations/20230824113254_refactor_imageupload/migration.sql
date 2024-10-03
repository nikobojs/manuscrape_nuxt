/*
  Warnings:

  - You are about to drop the `ObservationImage` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[imageId]` on the table `Observation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "DynamicProjectField" DROP CONSTRAINT "DynamicProjectField_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_userId_fkey";

-- DropForeignKey
ALTER TABLE "ObservationImage" DROP CONSTRAINT "ObservationImage_observationId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectField" DROP CONSTRAINT "ProjectField_projectId_fkey";

-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "imageId" INTEGER;

-- DropTable
DROP TABLE "ObservationImage";

-- CreateTable
CREATE TABLE "ImageUpload" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observationId" INTEGER NOT NULL,
    "s3Path" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,

    CONSTRAINT "ImageUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImageUpload_observationId_key" ON "ImageUpload"("observationId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageUpload_s3Path_key" ON "ImageUpload"("s3Path");

-- CreateIndex
CREATE UNIQUE INDEX "Observation_imageId_key" ON "Observation"("imageId");

-- AddForeignKey
ALTER TABLE "ProjectField" ADD CONSTRAINT "ProjectField_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ImageUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
