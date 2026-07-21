ALTER TABLE "User" DROP CONSTRAINT "User_email_unique";--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "saml_organization_name" text;