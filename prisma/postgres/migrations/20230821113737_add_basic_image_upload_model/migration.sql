-- AlterTable
ALTER TABLE "DynamicProjectField" ADD COLUMN     "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ProjectField" ADD COLUMN     "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ObservationImage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observationId" INTEGER NOT NULL,
    "s3Path" TEXT NOT NULL,

    CONSTRAINT "ObservationImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ObservationImage_s3Path_key" ON "ObservationImage"("s3Path");

-- AddForeignKey
ALTER TABLE "ObservationImage" ADD CONSTRAINT "ObservationImage_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
