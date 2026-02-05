import { getImageUploadByObservationId } from "~~/server/utils/imageUploads";

export default safeResponseHandler(async (event) => {
  await requireUser(event);
  const params = event.context.params;
  await ensureURLResourceAccess(event, event.context.user);
  const observationId = parseIntParam(params?.observationId);

  const observation = await getObservationById(observationId, { id: true });
  if (!observation) {
    throw createError({
      statusCode: 404,
      statusMessage: "Observation was not found",
    });
  }

  const observationImage = await getImageUploadByObservationId(observation.id, {
    id: true,
    filePath: true,
    isS3: true,
    mimetype: true,
    originalName: true,
    createdAt: true,
  });

  if (typeof observationImage?.filePath !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "Observation has no image",
    });
  }

  const { readable, s3 } = await getUpload(
    observationImage.filePath,
    observationImage.isS3,
  );
  setHeader(event, "Content-Type", observationImage.mimetype);
  // NOTE: this assumes that all images routes uses version query params for cache
  setHeader(event, "Cache-Control", "max-age=31536000"); // one year cache

  // clean up open sockets just in case
  readable.on("end", () => {
    if (s3) s3.destroy();
  });
  readable.on("close", () => {
    if (s3) s3.destroy();
  });

  return readable;
});
