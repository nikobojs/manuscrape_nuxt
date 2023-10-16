import { captureException } from "@sentry/node";

export default safeResponseHandler(async (event) => {
  requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
  const params = event.context.params
  const observationId = parseIntParam(params?.observationId);
  const projectId = parseIntParam(params?.projectId);

  // fetch existing observation
  const observation = await prisma.observation.findUnique({
    select: {
      id: true,
      isDraft: true,
      projectId: true,
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

  // ensure observation cannot be updated if it isn't a draft any more
  if (!observation.isDraft) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not allowed to patch locked observations',
    });
  }

  const filesToDelete = [
    ...observation.fileUploads.map((f) => f.s3Path),
    ...(observation.image?.s3Path ? [observation.image.s3Path] : []),
  ];

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

  await prisma.observation.delete({
    where: { id: observationId },
  });


  return {
    msg: 'observation has been deleted!',
  };
});
