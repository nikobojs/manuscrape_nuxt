-- DropForeignKey
ALTER TABLE "DynamicProjectField" DROP CONSTRAINT "DynamicProjectField_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_imageId_fkey";

-- DropForeignKey
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectAccess" DROP CONSTRAINT "ProjectAccess_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectAccess" DROP CONSTRAINT "ProjectAccess_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectField" DROP CONSTRAINT "ProjectField_projectId_fkey";

-- AddForeignKey
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectField" ADD CONSTRAINT "ProjectField_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicProjectField" ADD CONSTRAINT "DynamicProjectField_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ImageUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
