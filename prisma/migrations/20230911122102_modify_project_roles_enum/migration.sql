/*
  Warnings:

  - The values [FULL_ACCESS] on the enum `ProjectRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjectRole_new" AS ENUM ('OWNER', 'INVITED');
ALTER TABLE "ProjectAccess" ALTER COLUMN "role" DROP NOT NULL;
UPDATE "ProjectAccess" SET "role" = NULL;
ALTER TABLE "ProjectAccess" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "ProjectAccess" ALTER COLUMN "role" TYPE "ProjectRole_new" USING ("role"::text::"ProjectRole_new");
ALTER TYPE "ProjectRole" RENAME TO "ProjectRole_old";
ALTER TYPE "ProjectRole_new" RENAME TO "ProjectRole";
DROP TYPE "ProjectRole_old";
ALTER TABLE "ProjectAccess" ALTER COLUMN "role" SET DEFAULT 'OWNER';
UPDATE "ProjectAccess" SET "role" = 'OWNER';
ALTER TABLE "ProjectAccess" ALTER COLUMN "role" SET NOT NULL;
COMMIT;

-- AlterTable
ALTER TABLE "ProjectAccess" ALTER COLUMN "role" SET DEFAULT 'OWNER';
