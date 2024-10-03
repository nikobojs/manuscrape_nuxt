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

  const res = await getUpload(file.filePath, file.isS3);

  // if (res.$metadata.httpStatusCode !== 200) {
  //   throw createError({
  //     statusCode: 404,
  //     statusMessage: 'File not found',
  //   })
  // }
  
  setHeader(event, 'Content-Disposition', `inline; filename="${file.originalName}"`)
  // return res.Body;
  return res;
});