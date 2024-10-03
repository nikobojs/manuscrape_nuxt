-- CreateTable
CREATE TABLE "ObservationDraft" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "ObservationDraft_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ObservationDraft" ADD CONSTRAINT "ObservationDraft_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObservationDraft" ADD CONSTRAINT "ObservationDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
