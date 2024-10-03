/*
  Warnings:

  - The values [READ] on the enum `FieldOperator` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FieldOperator_new" AS ENUM ('DIFF', 'SUM');
ALTER TABLE "DynamicProjectField" ALTER COLUMN "operator" TYPE "FieldOperator_new" USING ("operator"::text::"FieldOperator_new");
ALTER TYPE "FieldOperator" RENAME TO "FieldOperator_old";
ALTER TYPE "FieldOperator_new" RENAME TO "FieldOperator";
DROP TYPE "FieldOperator_old";
COMMIT;
