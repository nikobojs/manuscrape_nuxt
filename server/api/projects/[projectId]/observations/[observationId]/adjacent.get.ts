import { and, asc, desc, eq, lt, gt } from "drizzle-orm";
import { observations } from "~~/server/drizzle/schema";

export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  await ensureURLResourceAccess(event, user);

  const projectId = parseIntParam(event.context.params?.projectId);
  const observationId = parseIntParam(event.context.params?.observationId);

  const projectAccess = await ensureProjectAccess(user.id, projectId);
  const isOwner = projectAccess.role === "OWNER";

  const project = await getProjectById(projectId, {
    contributorsCanReadAllObservations: true,
  });

  // Build ownership filter — same logic as the list endpoint
  const whereAnd = [eq(observations.projectId, projectId)];
  if (!isOwner && !project?.contributorsCanReadAllObservations) {
    whereAnd.push(eq(observations.userId, user.id));
  }

  // Verify the observation exists
  const currentObs = await getObservationById(observationId, {
    id: true,
  });
  if (!currentObs) {
    throw createError({
      statusCode: 404,
      statusMessage: "Observation not found",
    });
  }

  // IDs are serial (auto-increment): lower ID = older, higher ID = newer.
  // Previous = older observation (lower ID)
  const prevResult = await db
    .select({ id: observations.id })
    .from(observations)
    .where(and(...whereAnd, lt(observations.id, observationId)))
    .orderBy(desc(observations.id))
    .limit(1);

  // Next = newer observation (higher ID)
  const nextResult = await db
    .select({ id: observations.id })
    .from(observations)
    .where(and(...whereAnd, gt(observations.id, observationId)))
    .orderBy(asc(observations.id))
    .limit(1);

  return {
    prevId: prevResult[0]?.id ?? null,
    nextId: nextResult[0]?.id ?? null,
  };
});
