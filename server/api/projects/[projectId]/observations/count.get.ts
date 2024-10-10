import { ExportProjectSchema } from "../exports.post";

export default safeResponseHandler(async (event) => {
  // require login
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);

  const projectId = parseIntParam(event.context.params?.projectId);
  await ensureProjectAccess(event.context.user.id, projectId)

  const queryParams = getQuery(event)

  // NOTE: Using ExportProjectSchema imported from other route. Schemas need seperation from routes ?
  const { startDate, endDate } = await ExportProjectSchema.validate(queryParams)

  const start = new Date(startDate); 
  const end = new Date(endDate);

  const count = await db.observation.count({
    where: {
      AND: [
        { projectId: { equals: projectId } },
        { createdAt: { gte: start } },
        { createdAt: { lte: end } },
        { isDraft: { equals: false } },
      ]
    }
  });
  
  return count 
})