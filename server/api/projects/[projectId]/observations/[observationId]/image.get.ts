export default safeResponseHandler(async (event) => {
  requireUser(event);
  const params = event.context.params;
  await ensureURLResourceAccess(event, event.context.user);
  const observationId = parseIntParam(params?.observationId);
  const observation = await prisma.observation.findUnique({
    select: {
      id: true,
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

  if (!observation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Observation was not found',
    })
  }

  if (typeof observation.image?.s3Path !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Observation has no image',
    })
  }

  const res = await getS3Upload(observation.image.s3Path);

  if (res.$metadata.httpStatusCode !== 200) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Observation image not found',
    })
  }
  
  return res.Body;
});