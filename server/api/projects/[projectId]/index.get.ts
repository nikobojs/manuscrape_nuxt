export default safeResponseHandler(async (event) => {
  const { user } = await requireUserFromSession(event);
  await ensureURLResourceAccess(event, user, [
    "OWNER",
    "INVITED",
  ]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);

  const projectRes = await getSmallProjects([projectId]);
  if (projectRes.length !== 1) {
    throw createError({
      status: 404,
      message: "Project was not found",
    });
  }

  setResponseStatus(event, 200);
  return projectRes[0]!;
});
