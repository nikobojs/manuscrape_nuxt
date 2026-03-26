import { getImageUploadById } from "~~/server/utils/imageUploads";
import { captureException } from "@sentry/node";

export default safeResponseHandler(async (event) => {
  await requireUser(event);
  const params = event.context.params;
  await ensureURLResourceAccess(event, event.context.user);
  const projectId = parseIntParam(params?.projectId);
  const observationId = parseIntParam(params?.observationId);
  const imageUploadId = parseIntParam(params?.imgId);

  const observation = await getObservationById(observationId, {
    id: true,
    projectId: true,
    isDraft: true,
  });
  if (!observation) {
    throw createError({
      statusCode: 404,
      statusMessage: "Observation was not found",
    });
  }
  if (observation.projectId !== projectId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Observation was not found",
    });
  }
  if (!observation.isDraft) {
    throw createError({
      statusCode: 403,
      statusMessage: "Will not delete image from a locked observation",
    });
  }

  const observationImage = await getImageUploadById(imageUploadId, {
    id: true,
    filePath: true,
    projectFieldId: true,
    observationId: true,
    isS3: true,
    mimetype: true,
    originalName: true,
    createdAt: true,
  });

  if (typeof observationImage?.filePath !== "string") {
    throw createError({
      statusCode: 404,
      statusMessage: "Image upload was not found",
    });
  } else if (observationImage.observationId !== observation.id) {
    captureException(
      new Error(
        "ImageUpload observation id is not equal to the provided observation id",
      ),
    );
    throw createError({
      statusCode: 404,
      statusMessage: "Image upload was not found",
    });
  }

  // delete existing ImageUpload row
  await deleteImageUpload(observationImage.id);
  try {
    // remove existing images on this observation in s3
    await deleteFiles(observationImage.filePath, observationImage.isS3);
  } catch (e: any) {
    // if unable to delete file, handle errors silently
    captureException(e);
  }

  setResponseStatus(event, 204);
});
