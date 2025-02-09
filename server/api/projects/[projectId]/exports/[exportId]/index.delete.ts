import { ProjectRole } from '@prisma-postgres/client'

export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const exportId = parseIntParam(event.context.params?.exportId);

  // fetch project export
  const projectExport = await db.projectExport.findUnique({
    where: { id: exportId, projectId },
    select: {
      filePath: true,
      isS3: true,
      status: true,
      mimetype: true,
      type: true,
    },
  });

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