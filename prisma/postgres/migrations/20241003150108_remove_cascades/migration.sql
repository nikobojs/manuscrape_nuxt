-- DropForeignKey
ALTER TABLE "DynamicProjectField" DROP CONSTRAINT "DynamicProjectField_field0Id_fkey";

-- DropForeignKey
ALTER TABLE "DynamicProjectField" DROP CONSTRAINT "DynamicProjectField_field1Id_fkey";

-- DropForeignKey
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectAccess" DROP CONSTRAINT "ProjectAccess_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectExport" DROP CONSTRAINT "ProjectExport_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectInvitation" DROP CONSTRAINT "ProjectInvitation_inviterId_fkey";

-- AddForeignKey
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_field0Id_fkey" FOREIGN KEY ("field0Id") REFERENCES "ProjectField"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_field1Id_fkey" FOREIGN KEY ("field1Id") REFERENCES "ProjectField"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProjectExport" ADD CONSTRAINT "ProjectExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
