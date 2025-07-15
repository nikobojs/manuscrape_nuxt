/*
  Warnings:

  - A unique constraint covering the columns `[samlNameId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authSource" TEXT NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "samlNameId" TEXT,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_samlNameId_key" ON "User"("samlNameId");
