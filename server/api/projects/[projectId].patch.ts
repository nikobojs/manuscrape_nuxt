import { PatchProjectSchema } from "#shared/schemas/PatchProject";

export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  await ensureURLResourceAccess(event, user, ["OWNER"]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const body = await readBody(event);
  const patch = await PatchProjectSchema.validate(body);
  await updateProject(projectId, patch);
  setResponseStatus(event, 204);
});
