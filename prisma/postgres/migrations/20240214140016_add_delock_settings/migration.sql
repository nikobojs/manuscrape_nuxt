-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "authorCanDelockObservations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerCanDelockObservations" BOOLEAN NOT NULL DEFAULT true;
