/*
  Warnings:

  - The values [TEXT_OR_CHOICE] on the enum `FieldType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FieldType_new" AS ENUM ('DATE', 'STRING', 'INT', 'FLOAT', 'DATETIME', 'BOOLEAN', 'CHOICE', 'AUTOCOMPLETE', 'AUTOCOMPLETE_ADD', 'TEXTAREA');
ALTER TABLE "ProjectField" ALTER COLUMN "type" TYPE "FieldType_new" USING ("type"::text::"FieldType_new");
ALTER TYPE "FieldType" RENAME TO "FieldType_old";
ALTER TYPE "FieldType_new" RENAME TO "FieldType";
DROP TYPE "FieldType_old";
COMMIT;
