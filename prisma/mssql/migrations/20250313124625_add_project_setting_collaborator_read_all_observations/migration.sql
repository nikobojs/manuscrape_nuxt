BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Project] ADD [contributorsCanReadAllObservations] BIT NOT NULL CONSTRAINT [Project_contributorsCanReadAllObservations_df] DEFAULT 0;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
