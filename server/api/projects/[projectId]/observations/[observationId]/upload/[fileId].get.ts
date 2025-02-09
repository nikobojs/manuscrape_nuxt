export default safeResponseHandler(async (event) => {
  await requireUser(event);
  const params = event.context.params;
  await ensureURLResourceAccess(event, event.context.user);
  const observationId = parseIntParam(params?.observationId);
  const fileId = parseIntParam(params?.fileId);

  const file = await db.fileUpload.findUnique({
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
  
  setHeader(event, 'Content-Disposition', `inline; filename="${file.originalName}"`)

  const { readable, s3 } = await getUpload(file.filePath, file.isS3);

  // clean up open sockets just in case
  readable.on('end', () => {
    if (s3) s3.destroy();
  });
  readable.on('close', () => {
    if (s3) s3.destroy();
  });
  
  return readable;
});