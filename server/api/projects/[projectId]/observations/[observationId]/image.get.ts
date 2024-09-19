export default safeResponseHandler(async (event) => {
  await requireUser(event);
  const params = event.context.params;
  await ensureURLResourceAccess(event, event.context.user);
  const observationId = parseIntParam(params?.observationId);
  const observation = await prisma.observation.findUnique({
    select: {
      id: true,
      image: {
        select: {
          filePath: true,
          isS3: true,
          mimetype: true,
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

  if (typeof observation.image?.filePath !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Observation has no image',
    })
  }

  const res = await getUpload(observation.image.filePath, observation.image.isS3);
  setHeader(event, 'Content-Type', observation.image.mimetype);
  // NOTE: this assumes that all images routes uses version query params for cache
  setHeader(event, 'Cache-Control', 'max-age=31536000'); // one year cache

  return res;
});