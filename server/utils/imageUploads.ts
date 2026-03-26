import { eq, and, inArray } from "drizzle-orm";
import { imageUploads } from "../drizzle/schema";

type ImageUploadInsert = Omit<
  Awaited<typeof imageUploads.$inferInsert>,
  "id" | "createdAt"
>;
type ImageUploadSelect = Partial<
  Record<keyof typeof imageUploads.$inferSelect, boolean>
>;

export async function createImageUpload(imageUpload: ImageUploadInsert) {
  return db
    .insert(imageUploads)
    .values({
      ...imageUpload,
      createdAt: new Date(),
    })
    .returning({
      id: imageUploads.id,
    })
    .then((res) => res[0]!);
}

export function getImageUploadByObsAndField<
  T extends Partial<Record<keyof ImageUploadSelect, boolean>>,
>(observationId: number, projectFieldId: number, select: T) {
  console.log("finding image upload by", { observationId, projectFieldId });
  return db.query.imageUploads.findFirst({
    columns: select,
    where: and(
      eq(imageUploads.observationId, observationId),
      eq(imageUploads.projectFieldId, projectFieldId),
    ),
  });
}

export function getImageUploadById<
  T extends Partial<Record<keyof ImageUploadSelect, boolean>>,
>(imgUploadId: number, select: T) {
  return db.query.imageUploads.findFirst({
    columns: select,
    where: eq(imageUploads.id, imgUploadId),
  });
}

export function getImageUploadsByObservationIds<
  T extends Partial<Record<keyof ImageUploadSelect, boolean>>,
>(observationIds: number[], select: T) {
  return db.query.imageUploads.findMany({
    columns: select,
    where: inArray(imageUploads.observationId, observationIds),
  });
}

export function deleteImageUpload(imageUploadId: number) {
  return db.delete(imageUploads).where(eq(imageUploads.id, imageUploadId));
}
