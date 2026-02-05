import { eq, inArray } from "drizzle-orm";
import { fileUploads } from "../drizzle/schema";

type FileUploadInsert = Omit<
  Awaited<typeof fileUploads.$inferInsert>,
  "id" | "createdAt"
>;
type FileUploadSelect = Partial<
  Record<keyof typeof fileUploads.$inferSelect, boolean>
>;

export async function createFileUpload(fileUpload: FileUploadInsert) {
  return db
    .insert(fileUploads)
    .values({
      ...fileUpload,
      createdAt: new Date(),
    })
    .returning({
      id: fileUploads.id,
    })
    .then((res) => res[0]!);
}

export function getFileUploadById<
  T extends Partial<Record<keyof FileUploadSelect, boolean>>,
>(fileUploadId: number, select: T): Promise<FileUploadResponse | undefined> {
  return db.query.fileUploads.findFirst({
    columns: select,
    where: eq(fileUploads.id, fileUploadId),
  });
}

export function getFileUploadsByObservationId<
  T extends Partial<Record<keyof FileUploadSelect, boolean>>,
>(observationId: number, select: T) {
  return db.query.fileUploads.findMany({
    columns: select,
    where: eq(fileUploads.observationId, observationId),
  });
}

export function getFileUploadsByObservationIds<
  T extends Partial<Record<keyof FileUploadSelect, boolean>>,
>(observationIds: number[], select: T) {
  return db.query.fileUploads.findMany({
    columns: select,
    where: inArray(fileUploads.observationId, observationIds),
  });
}

export function deleteFileUpload(fileUploadId: number) {
  return db.delete(fileUploads).where(eq(fileUploads.id, fileUploadId));
}
