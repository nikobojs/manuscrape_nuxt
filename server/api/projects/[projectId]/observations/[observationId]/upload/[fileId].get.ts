export default safeResponseHandler(async (event) => {
  requireUser(event);
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

  const res = await getS3Upload(file.s3Path);

  if (res.$metadata.httpStatusCode !== 200) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found',
    })
  }
  
  setHeader(event, 'Content-Disposition', `inline; filename="${file.originalName}"`)
  return res.Body;
});