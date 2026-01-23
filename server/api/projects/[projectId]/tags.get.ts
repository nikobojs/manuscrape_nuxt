export default safeResponseHandler(async (event) => {
  // Require login
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);

  // Parse projectId
  const projectId = parseIntParam(event.context.params?.projectId);

  // Check project access
  const projectAccess = await db.projectAccess.findFirst({
    select: { role: true },
    where: {
      projectId,
      userId: event.context.user.id,
    },
  });

  if (!projectAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: "You don't have access to this project",
    });
  }

  // Fetch tags ordered alphabetically by name
  const tags = await db.tag.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  return {
    tags,
    total: tags.length,
  };
});
