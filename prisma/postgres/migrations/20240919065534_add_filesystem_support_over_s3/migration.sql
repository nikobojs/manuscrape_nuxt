-- DropIndex
DROP INDEX "FileUpload_s3Path_key";
DROP INDEX "ImageUpload_s3Path_key";

-- AlterTable
ALTER TABLE "FileUpload" RENAME "s3Path" TO "filePath";
ALTER TABLE "FileUpload" ADD COLUMN "isS3" BOOLEAN;
ALTER TABLE "ImageUpload" RENAME "s3Path" TO "filePath";
ALTER TABLE "ImageUpload" ADD COLUMN "isS3" BOOLEAN;
ALTER TABLE "ProjectExport" RENAME "s3Path" TO "filePath";
ALTER TABLE "ProjectExport" ADD COLUMN "isS3" BOOLEAN;
ALTER TABLE "ProjectExport" ALTER COLUMN "filePath" SET NOT NULL;

UPDATE "FileUpload" SET "isS3" = true;
UPDATE "ImageUpload" SET "isS3" = true;
UPDATE "ProjectExport" SET "isS3" = true;

ALTER TABLE "FileUpload" ALTER COLUMN "isS3" SET NOT NULL;
ALTER TABLE "ImageUpload" ALTER COLUMN "isS3" SET NOT NULL;
ALTER TABLE "ProjectExport" ALTER COLUMN "isS3" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FileUpload_filePath_key" ON "FileUpload"("filePath");
CREATE UNIQUE INDEX "ImageUpload_filePath_key" ON "ImageUpload"("filePath");
CREATE UNIQUE INDEX "ProjectExport_filePath_key" ON "ProjectExport"("filePath");
