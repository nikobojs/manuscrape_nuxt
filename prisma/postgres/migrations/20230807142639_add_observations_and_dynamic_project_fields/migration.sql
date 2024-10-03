/*
  Warnings:

  - Added the required column `data` to the `Observation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `Observation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FieldOperator" AS ENUM ('READ', 'DIFF', 'SUM');

-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "projectId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "DynamicProjectField" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "operator" "FieldOperator" NOT NULL,
    "field0Id" INTEGER NOT NULL,
    "field1Id" INTEGER NOT NULL,

    CONSTRAINT "DynamicProjectField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DynamicProjectField_field0Id_field1Id_operator_key" ON "DynamicProjectField"("field0Id", "field1Id", "operator");

-- AddForeignKey
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_field0Id_fkey" FOREIGN KEY ("field0Id") REFERENCES "ProjectField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_field1Id_fkey" FOREIGN KEY ("field1Id") REFERENCES "ProjectField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
