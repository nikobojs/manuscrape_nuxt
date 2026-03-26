import {
  getImageUploadById,
  getImageUploadByObsAndField,
} from "~~/server/utils/imageUploads";
import * as yup from "yup";
import { requireProjectFieldById } from "~~/server/utils/projectFields";

const queryDto = yup
  .object({
    projectFieldId: yup.string().required(),
  })
  .required();

export default safeResponseHandler(async (event) => {
  await requireUser(event);
  const params = event.context.params;
  const _query = getQuery(event);
  const query = await queryDto.validate(_query);
  const projectFieldId = parseIntParam(query.projectFieldId);
  await ensureURLResourceAccess(event, event.context.user);
  const observationId = parseIntParam(params?.observationId);
  const imageUploadId = parseIntParam(params?.imgId);

  const observation = await getObservationById(observationId, {
    id: true,
    projectId: true,
  });
  if (!observation) {
    throw createError({
      statusCode: 404,
      statusMessage: "Observation was not found",
    });
  }

  // ensure project field id is in the same project as the observation
  const projectField = await requireProjectFieldById(projectFieldId, {
    id: true,
    projectId: true,
  });
  if (projectField.projectId !== observation.projectId) {
    // TODO: report error
    throw createError({
      status: 400,
      message:
        "The project field does not exist in the same project as the requested observation",
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
      statusCode: 400,
      statusMessage: "Observation has no image",
    });
  } else if (observationImage.observationId !== observation.id) {
    // TODO: report error
    throw createError({
      statusCode: 404,
      statusMessage: "Image upload was not found",
    });
  } else if (observationImage.projectFieldId !== projectFieldId) {
    // TODO: report error
    throw createError({
      statusCode: 404,
      statusMessage: "Image upload was not found",
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
