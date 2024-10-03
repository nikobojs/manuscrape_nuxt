BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectAccess] (
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProjectAccess_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [ProjectAccess_role_df] DEFAULT 'OWNER',
    [nameInProject] NVARCHAR(1000) NOT NULL,
    [userId] INT NOT NULL,
    [projectId] INT NOT NULL,
    CONSTRAINT [ProjectAccess_pkey] PRIMARY KEY CLUSTERED ([projectId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[Project] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Project_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [authorId] INT,
    [authorCanDelockObservations] BIT NOT NULL CONSTRAINT [Project_authorCanDelockObservations_df] DEFAULT 0,
    [ownerCanDelockObservations] BIT NOT NULL CONSTRAINT [Project_ownerCanDelockObservations_df] DEFAULT 0,
    [storageLimit] INT NOT NULL CONSTRAINT [Project_storageLimit_df] DEFAULT 1000000000,
    CONSTRAINT [Project_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectField] (
    [id] INT NOT NULL IDENTITY(1,1),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProjectField_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [label] NVARCHAR(1000) NOT NULL,
    [projectId] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [choices] NVARCHAR(1000),
    [required] BIT NOT NULL CONSTRAINT [ProjectField_required_df] DEFAULT 0,
    [index] INT NOT NULL,
    CONSTRAINT [ProjectField_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProjectField_projectId_index_key] UNIQUE NONCLUSTERED ([projectId],[index]),
    CONSTRAINT [ProjectField_projectId_label_key] UNIQUE NONCLUSTERED ([projectId],[label])
);

-- CreateTable
CREATE TABLE [dbo].[DynamicProjectField] (
    [id] INT NOT NULL IDENTITY(1,1),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DynamicProjectField_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [label] NVARCHAR(1000) NOT NULL,
    [projectId] INT NOT NULL,
    [operator] NVARCHAR(1000) NOT NULL,
    [field0Id] INT NOT NULL,
    [field1Id] INT NOT NULL,
    CONSTRAINT [DynamicProjectField_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DynamicProjectField_field0Id_field1Id_operator_key] UNIQUE NONCLUSTERED ([field0Id],[field1Id],[operator])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectInvitation] (
    [id] INT NOT NULL IDENTITY(1,1),
    [inviterId] INT NOT NULL,
    [projectId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProjectInvitation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [expiresAt] DATETIME2 NOT NULL,
    [emailHash] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [ProjectInvitation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Observation] (
    [id] INT NOT NULL IDENTITY(1,1),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Observation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [Observation_updatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [projectId] INT NOT NULL,
    [userId] INT,
    [data] NVARCHAR(1000) NOT NULL,
    [imageId] INT,
    [uploadInProgress] BIT NOT NULL CONSTRAINT [Observation_uploadInProgress_df] DEFAULT 0,
    [isDraft] BIT NOT NULL CONSTRAINT [Observation_isDraft_df] DEFAULT 1,
    CONSTRAINT [Observation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Observation_imageId_key] UNIQUE NONCLUSTERED ([imageId])
);

-- CreateTable
CREATE TABLE [dbo].[FileUpload] (
    [id] INT NOT NULL IDENTITY(1,1),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [FileUpload_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [isS3] BIT NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [mimetype] NVARCHAR(1000) NOT NULL,
    [originalName] NVARCHAR(1000) NOT NULL,
    [observationId] INT NOT NULL,
    CONSTRAINT [FileUpload_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [FileUpload_filePath_key] UNIQUE NONCLUSTERED ([filePath])
);

-- CreateTable
CREATE TABLE [dbo].[ImageUpload] (
    [id] INT NOT NULL IDENTITY(1,1),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ImageUpload_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [isS3] BIT NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [mimetype] NVARCHAR(1000) NOT NULL,
    [originalName] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [ImageUpload_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ImageUpload_filePath_key] UNIQUE NONCLUSTERED ([filePath])
);

-- CreateTable
CREATE TABLE [dbo].[ProjectExport] (
    [id] INT NOT NULL IDENTITY(1,1),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ProjectExport_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [startDate] DATETIME2 NOT NULL,
    [endDate] DATETIME2 NOT NULL,
    [observationsCount] INT NOT NULL,
    [isS3] BIT NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [mimetype] NVARCHAR(1000) NOT NULL,
    [error] NVARCHAR(1000),
    [userId] INT,
    [size] INT NOT NULL,
    [projectId] INT NOT NULL,
    CONSTRAINT [ProjectExport_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProjectExport_filePath_key] UNIQUE NONCLUSTERED ([filePath])
);

-- AddForeignKey
ALTER TABLE [dbo].[ProjectAccess] ADD CONSTRAINT [ProjectAccess_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectAccess] ADD CONSTRAINT [ProjectAccess_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [Project_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectField] ADD CONSTRAINT [ProjectField_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DynamicProjectField] ADD CONSTRAINT [DynamicProjectField_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DynamicProjectField] ADD CONSTRAINT [DynamicProjectField_field0Id_fkey] FOREIGN KEY ([field0Id]) REFERENCES [dbo].[ProjectField]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DynamicProjectField] ADD CONSTRAINT [DynamicProjectField_field1Id_fkey] FOREIGN KEY ([field1Id]) REFERENCES [dbo].[ProjectField]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectInvitation] ADD CONSTRAINT [ProjectInvitation_inviterId_fkey] FOREIGN KEY ([inviterId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectInvitation] ADD CONSTRAINT [ProjectInvitation_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Observation] ADD CONSTRAINT [Observation_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Observation] ADD CONSTRAINT [Observation_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Observation] ADD CONSTRAINT [Observation_imageId_fkey] FOREIGN KEY ([imageId]) REFERENCES [dbo].[ImageUpload]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[FileUpload] ADD CONSTRAINT [FileUpload_observationId_fkey] FOREIGN KEY ([observationId]) REFERENCES [dbo].[Observation]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectExport] ADD CONSTRAINT [ProjectExport_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[ProjectExport] ADD CONSTRAINT [ProjectExport_projectId_fkey] FOREIGN KEY ([projectId]) REFERENCES [dbo].[Project]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
