import { captureException } from "@sentry/node";
import { getFileUploadsByObservationId } from "~~/server/utils/fileUploads";
import { deleteObservation } from "~~/server/utils/observations";

export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
  const params = event.context.params;
  const observationId = parseIntParam(params?.observationId);
  const projectId = parseIntParam(params?.projectId);

  // retrieve the user access role for the project
  const projectAccess = await ensureProjectAccess(user.id, projectId);

  // fetch existing observation
  const observation = await getObservationById(observationId, {
    id: true,
    isDraft: true,
    projectId: true,
    userId: true,
  });

  // if it does not exist, then throw up
  if (!observation || projectId !== observation.projectId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Observation was not found",
    });
  }

  const isAuthor = observation.userId === user.id;
  const isDraft = observation.isDraft;
  const isProjectOwner = projectAccess.role === "OWNER";

  // ensure observation cannot be removed if it isn't a draft and user is not owner
  if (!isDraft && !isProjectOwner) {
    throw createError({
      statusCode: 403,
      statusMessage: "You are not allowed to delete locked observations",
    });
  }

  // ensure owner cannot delete other users' drafts
  if (isDraft && !isAuthor) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "You are not allowed to delete other users' observation drafts",
    });
  }

  const fileUploads = await getFileUploadsByObservationId(observationId, {
    filePath: true,
    isS3: true,
  });

  const imageUpload = await getImageUploadByObservationId(observationId, {
    filePath: true,
    isS3: true,
  });

  const filesToDelete = [...fileUploads];
  if (imageUpload) filesToDelete.push(imageUpload);

  // delete all the files from s3 in the array (skips if empty)
  for (const fileToDelete of filesToDelete) {
    try {
      await deleteFiles(fileToDelete.filePath, fileToDelete.isS3);
    } catch (e: any) {
      // if unable to delete file, handle errors silently
      const err = new Error(
        `Unable to delete observation draft file '${fileToDelete}'`,
      );
      captureException(err);
      console.error(err);
    }
  }

  // delete the observation (cascades)
  await deleteObservation(observationId);

  return {
    succes: true,
  };
});
