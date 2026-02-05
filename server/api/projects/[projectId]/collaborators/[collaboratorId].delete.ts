import {
  deleteProjectAccess,
  getProjectAccess,
} from "~~/server/utils/projectAccess";

export default safeResponseHandler(async (event) => {
  await ensureURLResourceAccess(event, event.context.user, [
    "OWNER",
    "INVITED",
  ]);
  const user = await requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  const collaboratorId = parseIntParam(event.context.params?.collaboratorId);

  // ensure user has access
  const access = await getProjectAccess(user.id, projectId);
  if (!access)
    throw createError({
      statusCode: 403,
      statusMessage: "You do not have access to this project",
    });

  // if not owner, only allow deletion of self
  const isOwner = access.role === "OWNER";
  if (!isOwner && collaboratorId !== user.id) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "You are not allowed to disconnect other collaborators from project",
    });
  }

  // ensure collaborator marked for deletion is actually connected to project
  const collaboratorAccess = await getProjectAccess(collaboratorId, projectId);
  if (!collaboratorAccess) {
    throw createError({
      statusCode: 400,
      statusMessage: "Collaborator is not connected to project",
    });
  }

  // remove collaborator access to project
  await deleteProjectAccess(collaboratorId, projectId);

  return { success: true };
});
