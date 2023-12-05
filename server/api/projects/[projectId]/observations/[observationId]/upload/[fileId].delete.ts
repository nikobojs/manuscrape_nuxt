
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
      s3Path: true,
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

  if (typeof file?.s3Path !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'File wasn\'t uploaded correctly',
    })
  }

  let res;
  try {
    res = await deleteS3Files(file.s3Path);
  } catch(e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: e.message,
    })
  }

  if (res.$metadata.httpStatusCode !== 204) {
    throw createError({
      statusCode: res.$metadata.httpStatusCode,
      statusMessage: 'File could not be deleted',
    })
  }
  const deleteRes = await prisma.fileUpload.delete({
    where: { id: fileId },
  });
  
  setResponseStatus(event, 204)
});