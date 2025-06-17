/*
  Warnings:

  - You are about to drop the `_ObservationToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ObservationToTag" DROP CONSTRAINT "_ObservationToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_ObservationToTag" DROP CONSTRAINT "_ObservationToTag_B_fkey";

-- DropTable
DROP TABLE "_ObservationToTag";

-- CreateTable
CREATE TABLE "ObservationTag" (
    "observationId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObservationTag_pkey" PRIMARY KEY ("observationId","tagId")
);

-- AddForeignKey
ALTER TABLE "ObservationTag" ADD CONSTRAINT "ObservationTag_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationTag" ADD CONSTRAINT "ObservationTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
