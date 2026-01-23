export default safeResponseHandler(async (event) => {
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [
    "OWNER",
    "INVITED",
  ]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const exportId = parseIntParam(event.context.params?.exportId);

  // get project export
  const projectExport: FullProjectExport | null =
    await db.projectExport.findUnique({
      where: {
        id: exportId,
        projectId,
      },
      select: projectExportQuery,
    });

  // fetch role to ensure either owner or project.contributorsCanExport
  const projectAccess = await db.projectAccess.findFirst({
    select: {
      role: true,
    },
    where: {
      projectId,
      userId: event.context.user.id,
    },
  });

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { contributorsCanExport: true },
  });

  // ensure project exists
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project was not found",
    });
  }

  const isOwner = projectAccess?.role === "OWNER";
  if (!isOwner && !project.contributorsCanExport) {
    throw createError({
      statusCode: 403,
      statusMessage: "Exporting is disabled for all except the project owner",
    });
  }

  // ensure exists
  if (!projectExport) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project export was not found",
    });
  }

  // return project export
  setResponseStatus(event, 200);
  return projectExport;
});
