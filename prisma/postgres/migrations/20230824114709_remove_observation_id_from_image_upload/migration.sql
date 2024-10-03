/*
  Warnings:

  - You are about to drop the column `observationId` on the `ImageUpload` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ImageUpload_observationId_key";

-- AlterTable
ALTER TABLE "ImageUpload" DROP COLUMN "observationId";
