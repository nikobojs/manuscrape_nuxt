ALTER TABLE "DynamicProjectField" DROP CONSTRAINT "DynamicProjectField_field0_id_ProjectField_id_fk";
--> statement-breakpoint
ALTER TABLE "DynamicProjectField" DROP CONSTRAINT "DynamicProjectField_field1_id_ProjectField_id_fk";
--> statement-breakpoint
ALTER TABLE "ObservationTag" DROP CONSTRAINT "ObservationTag_created_by_id_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_user_id_User_id_fk";
--> statement-breakpoint
ALTER TABLE "ProjectAccess" DROP CONSTRAINT "ProjectAccess_project_id_Project_id_fk";
--> statement-breakpoint
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT "ProjectInvitation_inviter_id_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_created_by_id_User_id_fk";
--> statement-breakpoint
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_field0_id_ProjectField_id_fk" FOREIGN KEY ("field0_id") REFERENCES "public"."ProjectField"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_field1_id_ProjectField_id_fk" FOREIGN KEY ("field1_id") REFERENCES "public"."ProjectField"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ObservationTag" ADD CONSTRAINT "ObservationTag_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_project_id_Project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."Project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_inviter_id_User_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;