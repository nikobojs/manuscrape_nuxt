ALTER TABLE "User" RENAME COLUMN "saml_name_id" TO "saml_identifier";--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "saml_name" text;