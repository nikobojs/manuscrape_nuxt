import { addUserToTags } from "~~/server/utils/observationTags";

export default safeResponseHandler(async (event) => {
  // Require login
  const user = await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);

  // Parse projectId
  const projectId = parseIntParam(event.context.params?.projectId);

  // Check project access
  await ensureProjectAccess(user.id, projectId);

  // Fetch tags ordered alphabetically by name
  const tags = await getObservationTagsInProject(projectId);
  const enrichedTags = await addUserToTags(tags);

  return {
    tags: enrichedTags,
    total: tags.length,
  };
});
