import {
  deleteFileUpload,
  getFileUploadById,
} from "~~/server/utils/fileUploads";

export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  const params = event.context.params;
  await ensureURLResourceAccess(event, event.context.user);
  const observationId = parseIntParam(params?.observationId);
  const fileId = parseIntParam(params?.fileId);

  const file = await getFileUploadById(fileId, {
    id: true,
    originalName: true,
    observationId: true,
    filePath: true,
    isS3: true,
  });

  if (!file || file.observationId !== observationId) {
    throw createError({
      statusCode: 404,
      statusMessage: "File was not found",
    });
  }

  if (typeof file?.filePath !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "File wasn't uploaded correctly",
    });
  }

  const observation = await getObservationById(observationId, {
    isDraft: true,
    projectId: true,
  });

  if (!observation) {
    throw createError({
      statusCode: 404,
      statusMessage: "Observation does not exist",
    });
  }

  const { role } = await ensureProjectAccess(user.id, observation?.projectId);

  // if observation is published and projectAccess != OWNER, don't allow file deletion
  if (!observation?.isDraft && role !== "OWNER") {
    throw createError({
      statusCode: 400,
      statusMessage:
        "You don't have permissions to remove file from a published observation",
    });
  }

  // delete the file from s3
  let res;
  try {
    res = await deleteFiles(file.filePath, file.isS3);
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: e.message,
    });
  }

  // if s3 deletion went well, delete from file metadata from database
  await deleteFileUpload(fileId);

  setResponseStatus(event, 204);
});
