-- CreateTable
CREATE TABLE "FileUpload" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "s3Path" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "observationId" INTEGER NOT NULL,

    CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileUpload_s3Path_key" ON "FileUpload"("s3Path");

-- CreateIndex
CREATE UNIQUE INDEX "FileUpload_observationId_key" ON "FileUpload"("observationId");

-- AddForeignKey
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
