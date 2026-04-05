import { eq, and, inArray } from "drizzle-orm";
import sharp from "sharp";
import { imageUploads } from "../drizzle/schema";
import { captureException } from "@sentry/node";

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

export async function stripImageExif(buffer: Buffer) {
  try {
    // validate actual file format
    const metadata = await sharp(buffer).metadata();
    if (!metadata.format) {
      captureException(
        new Error("User uploaded image without parsable input data"),
      );
      throw createError({
        statusCode: 400,
        message: "Could not determine image format",
      });
    }

    // remove EXIF/metadata and process
    // NOTE: This forces a re-encode and drops all metadata by default
    const processedBuffer = await sharp(buffer).toBuffer();

    // Return or save processedBuffer
    return processedBuffer;
  } catch (error) {
    captureException(error);
    throw createError({
      status: 400,
      message: "Could not determine image format",
    });
  }
}
