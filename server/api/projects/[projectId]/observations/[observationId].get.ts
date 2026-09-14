export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  await ensureURLResourceAccess(event, user);
  const observationId = parseIntParam(event.context.params?.observationId);
  const fullObs = await getFullObservation(observationId);
  if (!fullObs) {
    throw createError({
      statusCode: 404,
      statusMessage: "Observation not found",
    });
  }

  return fullObs;
});
