ALTER TYPE "public"."ExportStatus" RENAME TO "export_status";--> statement-breakpoint
ALTER TYPE "public"."ExportType" RENAME TO "export_type";--> statement-breakpoint
ALTER TYPE "public"."FieldOperator" RENAME TO "field_operator";--> statement-breakpoint
ALTER TYPE "public"."FieldType" RENAME TO "field_type";--> statement-breakpoint
ALTER TYPE "public"."ProjectRole" RENAME TO "project_role";--> statement-breakpoint
ALTER TABLE "_prisma_migrations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "_prisma_migrations" CASCADE;--> statement-breakpoint
ALTER TABLE "Project" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "Project" RENAME COLUMN "authorId" TO "author_id";--> statement-breakpoint
ALTER TABLE "Project" RENAME COLUMN "authorCanDelockObservations" TO "author_can_delock_observations";--> statement-breakpoint
ALTER TABLE "Project" RENAME COLUMN "ownerCanDelockObservations" TO "owner_can_delock_observations";--> statement-breakpoint
ALTER TABLE "Project" RENAME COLUMN "contributorsCanReadAllObservations" TO "contributors_can_read_all_observations";--> statement-breakpoint
ALTER TABLE "Project" RENAME COLUMN "contributorsCanExport" TO "contributors_can_export";--> statement-breakpoint
ALTER TABLE "Project" RENAME COLUMN "storageLimit" TO "storage_limit";--> statement-breakpoint
ALTER TABLE "ImageUpload" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "ImageUpload" RENAME COLUMN "isS3" TO "is_s3";--> statement-breakpoint
ALTER TABLE "ImageUpload" RENAME COLUMN "filePath" TO "file_path";--> statement-breakpoint
ALTER TABLE "ImageUpload" RENAME COLUMN "originalName" TO "original_name";--> statement-breakpoint
ALTER TABLE "ImageUpload" RENAME COLUMN "observationId" TO "observation_id";--> statement-breakpoint
ALTER TABLE "Tag" RENAME COLUMN "projectId" TO "project_id";--> statement-breakpoint
ALTER TABLE "Tag" RENAME COLUMN "createdById" TO "created_by_id";--> statement-breakpoint
ALTER TABLE "Observation" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "Observation" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "Observation" RENAME COLUMN "projectId" TO "project_id";--> statement-breakpoint
ALTER TABLE "Observation" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "Observation" RENAME COLUMN "uploadInProgress" TO "upload_in_progress";--> statement-breakpoint
ALTER TABLE "Observation" RENAME COLUMN "isDraft" TO "is_draft";--> statement-breakpoint
ALTER TABLE "ProjectExport" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "ProjectExport" RENAME COLUMN "startDate" TO "start_date";--> statement-breakpoint
ALTER TABLE "ProjectExport" RENAME COLUMN "endDate" TO "end_date";--> statement-breakpoint
ALTER TABLE "ProjectExport" RENAME COLUMN "observationsCount" TO "observations_count";--> statement-breakpoint
ALTER TABLE "ProjectExport" RENAME COLUMN "isS3" TO "is_s3";--> statement-breakpoint
ALTER TABLE "ProjectExport" RENAME COLUMN "filePath" TO "file_path";--> statement-breakpoint
ALTER TABLE "ProjectExport" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "ProjectExport" RENAME COLUMN "projectId" TO "project_id";--> statement-breakpoint
ALTER TABLE "ProjectInvitation" RENAME COLUMN "inviterId" TO "inviter_id";--> statement-breakpoint
ALTER TABLE "ProjectInvitation" RENAME COLUMN "projectId" TO "project_id";--> statement-breakpoint
ALTER TABLE "ProjectInvitation" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "ProjectInvitation" RENAME COLUMN "expiresAt" TO "expires_at";--> statement-breakpoint
ALTER TABLE "ProjectInvitation" RENAME COLUMN "emailHash" TO "email_hash";--> statement-breakpoint
ALTER TABLE "FileUpload" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "FileUpload" RENAME COLUMN "isS3" TO "is_s3";--> statement-breakpoint
ALTER TABLE "FileUpload" RENAME COLUMN "filePath" TO "file_path";--> statement-breakpoint
ALTER TABLE "FileUpload" RENAME COLUMN "originalName" TO "original_name";--> statement-breakpoint
ALTER TABLE "FileUpload" RENAME COLUMN "observationId" TO "observation_id";--> statement-breakpoint
ALTER TABLE "ProjectField" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "ProjectField" RENAME COLUMN "projectId" TO "project_id";--> statement-breakpoint
ALTER TABLE "DynamicProjectField" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "DynamicProjectField" RENAME COLUMN "projectId" TO "project_id";--> statement-breakpoint
ALTER TABLE "DynamicProjectField" RENAME COLUMN "field0Id" TO "field0_id";--> statement-breakpoint
ALTER TABLE "DynamicProjectField" RENAME COLUMN "field1Id" TO "field1_id";--> statement-breakpoint
ALTER TABLE "User" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "ObservationTag" RENAME COLUMN "observationId" TO "observation_id";--> statement-breakpoint
ALTER TABLE "ObservationTag" RENAME COLUMN "tagId" TO "tag_id";--> statement-breakpoint
ALTER TABLE "ObservationTag" RENAME COLUMN "createdById" TO "created_by_id";--> statement-breakpoint
ALTER TABLE "ObservationTag" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "ProjectAccess" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "ProjectAccess" RENAME COLUMN "nameInProject" TO "name_in_project";--> statement-breakpoint
ALTER TABLE "ProjectAccess" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "ProjectAccess" RENAME COLUMN "projectId" TO "project_id";--> statement-breakpoint
ALTER TABLE "Project" DROP CONSTRAINT "Project_authorId_fkey";
--> statement-breakpoint
ALTER TABLE "ImageUpload" DROP CONSTRAINT "ImageUpload_observationId_fkey";
--> statement-breakpoint
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_createdById_fkey";
--> statement-breakpoint
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_projectId_fkey";
--> statement-breakpoint
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_projectId_fkey";
--> statement-breakpoint
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_userId_fkey";
--> statement-breakpoint
ALTER TABLE "ProjectExport" DROP CONSTRAINT "ProjectExport_projectId_fkey";
--> statement-breakpoint
ALTER TABLE "ProjectExport" DROP CONSTRAINT "ProjectExport_userId_fkey";
--> statement-breakpoint
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT "ProjectInvitation_inviterId_fkey";
--> statement-breakpoint
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT "ProjectInvitation_projectId_fkey";
--> statement-breakpoint
ALTER TABLE "FileUpload" DROP CONSTRAINT "FileUpload_observationId_fkey";
--> statement-breakpoint
ALTER TABLE "ProjectField" DROP CONSTRAINT "ProjectField_projectId_fkey";
--> statement-breakpoint
ALTER TABLE "DynamicProjectField" DROP CONSTRAINT "DynamicProjectField_field0Id_fkey";
--> statement-breakpoint
ALTER TABLE "DynamicProjectField" DROP CONSTRAINT "DynamicProjectField_field1Id_fkey";
--> statement-breakpoint
ALTER TABLE "DynamicProjectField" DROP CONSTRAINT "DynamicProjectField_projectId_fkey";
--> statement-breakpoint
ALTER TABLE "ObservationTag" DROP CONSTRAINT "ObservationTag_observationId_fkey";
--> statement-breakpoint
ALTER TABLE "ObservationTag" DROP CONSTRAINT "ObservationTag_tagId_fkey";
--> statement-breakpoint
ALTER TABLE "ProjectAccess" DROP CONSTRAINT "ProjectAccess_projectId_fkey";
--> statement-breakpoint
ALTER TABLE "ProjectAccess" DROP CONSTRAINT "ProjectAccess_userId_fkey";
--> statement-breakpoint
ALTER TABLE "ProjectField" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."field_type";--> statement-breakpoint
CREATE TYPE "public"."field_type" AS ENUM('DATE', 'STRING', 'INT', 'FLOAT', 'DATETIME', 'BOOLEAN', 'CHOICE', 'MULTIPLE_CHOICE_ADD', 'AUTOCOMPLETE', 'AUTOCOMPLETE_ADD', 'TEXTAREA');--> statement-breakpoint
ALTER TABLE "ProjectField" ALTER COLUMN "type" SET DATA TYPE "public"."field_type" USING "type"::"public"."field_type";--> statement-breakpoint
DROP INDEX "ImageUpload_filePath_key";--> statement-breakpoint
DROP INDEX "ImageUpload_observationId_key";--> statement-breakpoint
DROP INDEX "Tag_projectId_name_key";--> statement-breakpoint
DROP INDEX "ProjectExport_filePath_key";--> statement-breakpoint
DROP INDEX "FileUpload_filePath_key";--> statement-breakpoint
DROP INDEX "ProjectField_projectId_index_key";--> statement-breakpoint
DROP INDEX "ProjectField_projectId_label_key";--> statement-breakpoint
DROP INDEX "DynamicProjectField_field0Id_field1Id_operator_key";--> statement-breakpoint
DROP INDEX "User_email_key";--> statement-breakpoint
ALTER TABLE "ObservationTag" DROP CONSTRAINT "ObservationTag_pkey";--> statement-breakpoint
ALTER TABLE "ProjectAccess" DROP CONSTRAINT "ProjectAccess_pkey";--> statement-breakpoint
ALTER TABLE "Project" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "ImageUpload" ALTER COLUMN "mimetype" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "Tag" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "ProjectExport" ALTER COLUMN "mimetype" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "FileUpload" ALTER COLUMN "mimetype" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "ProjectField" ALTER COLUMN "label" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "DynamicProjectField" ALTER COLUMN "label" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "password" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "ObservationTag" ADD CONSTRAINT "ObservationTag_observation_id_tag_id_pk" PRIMARY KEY("observation_id","tag_id");--> statement-breakpoint
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_project_id_user_id_pk" PRIMARY KEY("project_id","user_id");--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_author_id_User_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ImageUpload" ADD CONSTRAINT "ImageUpload_observation_id_Observation_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."Observation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectExport" ADD CONSTRAINT "ProjectExport_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectExport" ADD CONSTRAINT "ProjectExport_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_inviter_id_User_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_observation_id_Observation_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."Observation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectField" ADD CONSTRAINT "ProjectField_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_field0_id_ProjectField_id_fk" FOREIGN KEY ("field0_id") REFERENCES "public"."ProjectField"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_field1_id_ProjectField_id_fk" FOREIGN KEY ("field1_id") REFERENCES "public"."ProjectField"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ObservationTag" ADD CONSTRAINT "ObservationTag_observation_id_Observation_id_fk" FOREIGN KEY ("observation_id") REFERENCES "public"."Observation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ObservationTag" ADD CONSTRAINT "ObservationTag_tag_id_Tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."Tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ObservationTag" ADD CONSTRAINT "ObservationTag_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tags_project_id_name_unique" ON "Tag" USING btree ("project_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "project_fields_project_id_index_unique" ON "ProjectField" USING btree ("project_id","index");--> statement-breakpoint
CREATE UNIQUE INDEX "project_fields_project_id_label_unique" ON "ProjectField" USING btree ("project_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "dynamic_pf_unique" ON "DynamicProjectField" USING btree ("field0_id","field1_id","operator");--> statement-breakpoint
ALTER TABLE "ImageUpload" ADD CONSTRAINT "ImageUpload_file_path_unique" UNIQUE("file_path");--> statement-breakpoint
ALTER TABLE "ImageUpload" ADD CONSTRAINT "ImageUpload_observation_id_unique" UNIQUE("observation_id");--> statement-breakpoint
ALTER TABLE "ProjectExport" ADD CONSTRAINT "ProjectExport_file_path_unique" UNIQUE("file_path");--> statement-breakpoint
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_file_path_unique" UNIQUE("file_path");--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_email_unique" UNIQUE("email");

-- modify observation data type to jsonb
ALTER TABLE "Observation" RENAME COLUMN "data" TO "dataText";
ALTER TABLE "Observation" ADD COLUMN "data" JSONB;
ALTER TABLE "Observation" ALTER COLUMN "data" SET DEFAULT '{}'::jsonb;--> statement-breakpoint
UPDATE "Observation" SET data = "dataText"::jsonb;
ALTER TABLE "Observation" ALTER COLUMN data SET NOT NULL;
ALTER TABLE "Observation" DROP COLUMN "dataText";
