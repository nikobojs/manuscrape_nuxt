/*
  Warnings:

  - Added the required column `nameInProject` to the `ProjectAccess` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProjectAccess" ADD COLUMN "nameInProject" TEXT;
UPDATE "ProjectAccess" pa SET "nameInProject" = u.email FROM "User" u WHERE u.id = pa."userId";
ALTER TABLE "ProjectAccess" ALTER COLUMN "nameInProject" SET NOT NULL;

