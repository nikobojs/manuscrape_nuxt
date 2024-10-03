-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('DATE', 'STRING', 'INT', 'FLOAT');

-- CreateTable
CREATE TABLE "ProjectField" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "type" "FieldType" NOT NULL,

    CONSTRAINT "ProjectField_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectField" ADD CONSTRAINT "ProjectField_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
