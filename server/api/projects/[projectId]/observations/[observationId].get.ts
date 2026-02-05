import { getFullObservation } from "~~/server/utils/observations";

export default safeResponseHandler(async (event) => {
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
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
