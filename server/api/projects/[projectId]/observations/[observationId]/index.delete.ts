import { ProjectRole } from "@prisma/client";
import { captureException } from "@sentry/node";

export default safeResponseHandler(async (event) => {
  const user = requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
  const params = event.context.params
  const observationId = parseIntParam(params?.observationId);
  const projectId = parseIntParam(params?.projectId);

  // retrieve the user access role for the project
  const projectAccess = await prisma.projectAccess.findFirst({
    where: {
      userId: user.id,
      projectId: projectId,
    },
    select: {
      role: true,
    }
  });

  // ensure user has access
  // TODO: ensureURLResourceAccess does this as well. Find a better way
  if (!projectAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: `You don't have access to this project`,
    });
  }

  // fetch existing observation
  const observation = await prisma.observation.findUnique({
    select: {
      id: true,
      isDraft: true,
      projectId: true,
      userId: true,
      fileUploads: {
        select: {
          s3Path: true,
        }
      },
      image: {
        select: {
          s3Path: true,
        }
      }
    },
    where: {
      id: observationId,
    }
  });

  // if it does not exist, then throw up
  if (!observation || projectId !== observation.projectId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Observation was not found',
    })
  }

  const isAuthor = observation.userId === user.id;
  const isDraft = observation.isDraft;
  const isProjectOwner = projectAccess.role === ProjectRole.OWNER;

  // ensure observation cannot be removed if it isn't a draft and user is not owner
  if (!isDraft && !isProjectOwner) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not allowed to delete locked observations',
    });
  }

  // ensure owner cannot delete other users' drafts
  if (isDraft && !isAuthor) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not allowed to delete other users\' observation drafts',
    });
  }

  // retrieve a list of all files to be deleted
  const filesToDelete = [
    ...observation.fileUploads.map((f) => f.s3Path), // all file uploads
    ...(observation.image?.s3Path ? [observation.image.s3Path] : []), // uploaded image, if any
  ];

  // delete all the files from s3 in the array (skips if empty)
  for (const fileToDelete of filesToDelete) {
    try {
      const deleteRes = await deleteS3Files(fileToDelete)
      if (deleteRes.$metadata.httpStatusCode !== 204) {
        const err = new Error(`Unable to delete observation draft file '${fileToDelete}'`);
        captureException(err);
        console.error(err)
      } else {
        console.info('deleted file', fileToDelete)
      }
    } catch(e: any) {
      // if unable to delete file, handle errors silently
      const err = new Error(`Unable to delete observation draft file '${fileToDelete}'`);
      captureException(err);
      console.error(err)
    }
  }

  // delete the observation (cascades to its files as well)
  await prisma.observation.delete({
    where: { id: observationId },
  });


  // return response
  // TODO: set better response status code (don't forget response handling in frontend)
  return {
    msg: 'observation has been deleted!',
  };
});
