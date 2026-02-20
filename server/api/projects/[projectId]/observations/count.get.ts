import { ExportProjectSchema } from "#shared/schemas/ExportProject";

export default safeResponseHandler(async (event) => {
  // require login
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);

  const projectId = parseIntParam(event.context.params?.projectId);
  await ensureProjectAccess(event.context.user.id, projectId);

  const queryParams = getQuery(event);

  // NOTE: Using ExportProjectSchema imported from other route. Schemas need seperation from routes ?
  const { startDate, endDate } =
    await ExportProjectSchema.validate(queryParams);

  const start = new Date(startDate);
  const end = new Date(endDate);

  const observationIds = await searchObservationIds(
    projectId,
    start,
    end,
    false,
  );
  const images = await getImageUploadsByObservationIds(observationIds, {
    id: true,
  });
  const uploads = await getFileUploadsByObservationIds(observationIds, {
    id: true,
  });

  return {
    observationCount: observationIds.length,
    imageCount: images.length,
    uploadsCount: uploads.length,
  };
});
