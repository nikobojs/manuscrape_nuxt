import { ProjectRole } from "@prisma-postgres/client";
import { captureException } from "@sentry/node";

export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
  const params = event.context.params
  const observationId = parseIntParam(params?.observationId);
  const projectId = parseIntParam(params?.projectId);

  // retrieve the user access role for the project
  const projectAccess = await db.projectAccess.findFirst({
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
  const observation = await db.observation.findUnique({
    select: {
      id: true,
      isDraft: true,
      projectId: true,
      userId: true,
      fileUploads: {
        select: {
          filePath: true,
          isS3: true,
        }
      },
      image: {
        select: {
          filePath: true,
          isS3: true,
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

  const filesToDelete = [...observation.fileUploads];
  if (observation.image?.filePath) filesToDelete.push(observation.image);

  // delete all the files from s3 in the array (skips if empty)
  for (const fileToDelete of filesToDelete) {
    try {
      await deleteFiles(fileToDelete.filePath, fileToDelete.isS3);
    } catch(e: any) {
      // if unable to delete file, handle errors silently
      const err = new Error(`Unable to delete observation draft file '${fileToDelete}'`);
      captureException(err);
      console.error(err)
    }
  }

  // delete the observation (cascades to its files as well)
  await db.observation.delete({
    where: { id: observationId },
  });

  // return response
  // TODO: set better response status code (don't forget response handling in frontend)
  return {
    msg: 'observation has been deleted!',
  };
});
