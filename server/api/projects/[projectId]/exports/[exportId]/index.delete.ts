import { ProjectRole } from '@prisma-postgres/client'

export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  const user = await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER, ProjectRole.INVITED]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const exportId = parseIntParam(event.context.params?.exportId);

  // fetch role to ensure either owner or project.contributorsCanExport
  const projectAccess = await db.projectAccess.findFirst({
    select: {
      role: true,
    },
    where: {
      projectId,
      userId: event.context.user.id,
    }
  });

  // fetch project export
  const projectExport = await db.projectExport.findUnique({
    where: { id: exportId, projectId },
    select: {
      filePath: true,
      isS3: true,
      status: true,
      mimetype: true,
      type: true,
      userId: true,
    },
  });
  const isOwner = projectAccess?.role === ProjectRole.OWNER;
  const isAuthor = projectExport?.userId === user.id;
  if (!isOwner && !isAuthor) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You cannot delete other users\' exports unless you are project owner',
    });
  }

  // ensure project export db entry exists
  if (!projectExport) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project export was not found',
    })
  }

  // if project export has filePath, there is most likely a file there
  // that needs to be deleted
  if (projectExport.filePath) {
    const fileToDelete = projectExport.filePath;
    await deleteFiles(fileToDelete, projectExport.isS3);
  }

  // delete the db entry
  await db.projectExport.delete({
    where: { id: exportId },
  });

  // return success
  setResponseStatus(event, 204);
  return { success: true };
});