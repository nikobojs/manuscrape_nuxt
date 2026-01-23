-- Current sql file was generated after introspecting the database from the deprecated prisma schema
-- If you want to upgrade an existing database based on prisma migrations, please comment out this migration temporarily

CREATE TYPE "public"."ExportStatus" AS ENUM('QUEUED', 'GENERATING', 'DONE', 'ERRORED');--> statement-breakpoint
CREATE TYPE "public"."ExportType" AS ENUM('NVIVO', 'UPLOADS', 'MEDIA');--> statement-breakpoint
CREATE TYPE "public"."FieldOperator" AS ENUM('DIFF', 'SUM');--> statement-breakpoint
CREATE TYPE "public"."FieldType" AS ENUM('DATE', 'STRING', 'INT', 'FLOAT', 'DATETIME', 'BOOLEAN', 'CHOICE', 'AUTOCOMPLETE', 'AUTOCOMPLETE_ADD', 'TEXTAREA', 'MULTIPLE_CHOICE_ADD');--> statement-breakpoint
CREATE TYPE "public"."ProjectRole" AS ENUM('OWNER', 'INVITED');--> statement-breakpoint
CREATE TABLE "Project" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"authorId" integer,
	"authorCanDelockObservations" boolean DEFAULT false NOT NULL,
	"ownerCanDelockObservations" boolean DEFAULT false NOT NULL,
	"storageLimit" integer DEFAULT 1000000000 NOT NULL,
	"contributorsCanReadAllObservations" boolean DEFAULT false NOT NULL,
	"contributorsCanExport" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ImageUpload" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"filePath" text NOT NULL,
	"mimetype" text NOT NULL,
	"originalName" text NOT NULL,
	"isS3" boolean NOT NULL,
	"observationId" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Tag" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"projectId" integer NOT NULL,
	"createdById" integer
);
--> statement-breakpoint
CREATE TABLE "Observation" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"data" text DEFAULT '{}' NOT NULL,
	"projectId" integer NOT NULL,
	"userId" integer,
	"isDraft" boolean DEFAULT true NOT NULL,
	"updatedAt" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"uploadInProgress" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProjectExport" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"startDate" timestamp(3) NOT NULL,
	"endDate" timestamp(3) NOT NULL,
	"observationsCount" integer NOT NULL,
	"filePath" text NOT NULL,
	"type" "ExportType" NOT NULL,
	"status" "ExportStatus" NOT NULL,
	"mimetype" text NOT NULL,
	"size" integer NOT NULL,
	"error" text,
	"userId" integer,
	"projectId" integer NOT NULL,
	"isS3" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProjectInvitation" (
	"id" serial PRIMARY KEY NOT NULL,
	"inviterId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"createdAt" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"emailHash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "FileUpload" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"filePath" text NOT NULL,
	"mimetype" text NOT NULL,
	"originalName" text NOT NULL,
	"observationId" integer NOT NULL,
	"isS3" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProjectField" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"projectId" integer NOT NULL,
	"type" "FieldType" NOT NULL,
	"createdAt" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"choices" text,
	"index" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DynamicProjectField" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"projectId" integer NOT NULL,
	"operator" "FieldOperator" NOT NULL,
	"field0Id" integer NOT NULL,
	"field1Id" integer NOT NULL,
	"createdAt" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"createdAt" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ObservationTag" (
	"observationId" integer NOT NULL,
	"tagId" integer NOT NULL,
	"createdById" integer,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "ObservationTag_pkey" PRIMARY KEY("observationId","tagId")
);
--> statement-breakpoint
CREATE TABLE "ProjectAccess" (
	"role" "ProjectRole" DEFAULT 'OWNER' NOT NULL,
	"userId" integer NOT NULL,
	"projectId" integer NOT NULL,
	"createdAt" timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"nameInProject" text NOT NULL,
	CONSTRAINT "ProjectAccess_pkey" PRIMARY KEY("userId","projectId")
);
--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ImageUpload" ADD CONSTRAINT "ImageUpload_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "public"."Observation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectExport" ADD CONSTRAINT "ProjectExport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProjectExport" ADD CONSTRAINT "ProjectExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "FileUpload" ADD CONSTRAINT "FileUpload_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "public"."Observation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProjectField" ADD CONSTRAINT "ProjectField_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_field0Id_fkey" FOREIGN KEY ("field0Id") REFERENCES "public"."ProjectField"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_field1Id_fkey" FOREIGN KEY ("field1Id") REFERENCES "public"."ProjectField"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ObservationTag" ADD CONSTRAINT "ObservationTag_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "public"."Observation"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ObservationTag" ADD CONSTRAINT "ObservationTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "ImageUpload_filePath_key" ON "ImageUpload" USING btree ("filePath" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ImageUpload_observationId_key" ON "ImageUpload" USING btree ("observationId" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Tag_projectId_name_key" ON "Tag" USING btree ("projectId" int4_ops,"name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ProjectExport_filePath_key" ON "ProjectExport" USING btree ("filePath" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "FileUpload_filePath_key" ON "FileUpload" USING btree ("filePath" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ProjectField_projectId_index_key" ON "ProjectField" USING btree ("projectId" int4_ops,"index" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "ProjectField_projectId_label_key" ON "ProjectField" USING btree ("projectId" int4_ops,"label" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "DynamicProjectField_field0Id_field1Id_operator_key" ON "DynamicProjectField" USING btree ("field0Id" int4_ops,"field1Id" int4_ops,"operator" enum_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email" text_ops);
