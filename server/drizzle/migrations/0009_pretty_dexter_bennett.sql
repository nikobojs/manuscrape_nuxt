CREATE TYPE "public"."auth_source" AS ENUM('SAML', 'PASSWORD');--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "saml_name_id" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "auth_source" "auth_source";
UPDATE "User" SET auth_source = 'PASSWORD';
ALTER TABLE "User" ALTER COLUMN "auth_source" SET NOT NULL;
