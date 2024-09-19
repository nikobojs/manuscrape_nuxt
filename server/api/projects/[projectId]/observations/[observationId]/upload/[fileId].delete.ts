
export default safeResponseHandler(async (event) => {
  await requireUser(event);
  const params = event.context.params;
  await ensureURLResourceAccess(event, event.context.user);
  const observationId = parseIntParam(params?.observationId);
  const fileId = parseIntParam(params?.fileId);

  const file = await prisma.fileUpload.findUnique({
    select: {
      id: true,
      originalName: true,
      observationId: true,
      filePath: true,
      isS3: true,
    },
    where: {
      id: fileId,
    }
  });

  if (!file || file.observationId !== observationId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File was not found',
    })
  }

  if (typeof file?.filePath !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'File wasn\'t uploaded correctly',
    })
  }

  const observation = await prisma.observation.findUnique({
    where: { id: observationId },
  });

  const projectAccess = await prisma.projectAccess.findFirst({
    select: {
      role: true,
    },
    where: {
      projectId: observation?.projectId,
      userId: event.context.user.id,
    }
  });

  if (!projectAccess) {
    // NOTE: unexpected because of middleware validation
    throw createError({
      statusCode: 403,
      statusMessage: 'You don\'t have access to the observation',
    });
  }

  // if observation is published and projectAccess != OWNER, don't allow file deletion
  if (!observation?.isDraft && projectAccess.role !== 'OWNER') {
    throw createError({
      statusCode: 400,
      statusMessage: 'You don\'t have permissions to remove file from a published observation',
    });
  }

  // delete the file from s3
  let res;
  try {
    res = await deleteFiles(file.filePath, file.isS3);
  } catch(e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: e.message,
    })
  }

  // if s3 deletion went well, delete from file metadata from database
  await prisma.fileUpload.delete({
    where: { id: fileId },
  });
  
  setResponseStatus(event, 204)
});