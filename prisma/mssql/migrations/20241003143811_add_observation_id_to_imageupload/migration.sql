/*
  Warnings:

  - You are about to drop the column `imageId` on the `Observation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[observationId]` on the table `ImageUpload` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `observationId` to the `ImageUpload` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Observation] DROP CONSTRAINT [Observation_imageId_fkey];

-- DropIndex
ALTER TABLE [dbo].[Observation] DROP CONSTRAINT [Observation_imageId_key];

-- AlterTable
ALTER TABLE [dbo].[ImageUpload] ADD [observationId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[Observation] DROP COLUMN [imageId];
ALTER TABLE [dbo].[Observation] ADD CONSTRAINT [Observation_data_df] DEFAULT '{}' FOR [data];

-- CreateIndex
ALTER TABLE [dbo].[ImageUpload] ADD CONSTRAINT [ImageUpload_observationId_key] UNIQUE NONCLUSTERED ([observationId]);

-- AddForeignKey
ALTER TABLE [dbo].[ImageUpload] ADD CONSTRAINT [ImageUpload_observationId_fkey] FOREIGN KEY ([observationId]) REFERENCES [dbo].[Observation]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
