export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  await ensureURLResourceAccess(event, user, ["OWNER"]);
  const projectId = parseIntParam(event.context.params?.projectId);
  const allowedRoles: ProjectRole[] = ["OWNER"];

  // TODO: write test and try deprecase following projectaccess test
  const access = await ensureProjectAccess(user.id, projectId);

  if (!allowedRoles.includes(access.role)) {
    throw createError({
      statusCode: 403,
      statusMessage:
        "You do not have the required project permissions to see its contributors",
    });
  }

  const collaborators: Collaborator[] = await getCollaboratorsInProjects([
    projectId,
  ]);

  if (!collaborators) {
    throw createError({
      statusCode: 404,
      statusMessage: "The project does not exist",
    });
  }

  return { collaborators };
});
