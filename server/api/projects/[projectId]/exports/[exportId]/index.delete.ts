import { ExportStatus, ProjectRole } from '@prisma/client'
import { safeResponseHandler } from '../../../../../utils/safeResponseHandler';
import { requireUser } from '../../../../../utils/authorize';
import { captureException } from '@sentry/node';

export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const exportId = parseIntParam(event.context.params?.exportId);

  // fetch project export
  const projectExport = await prisma.projectExport.findUnique({
    where: { id: exportId, projectId },
    select: {
      s3Path: true,
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

  // if project export has s3Path, there is most likely a file there
  // that needs to be deleted
  if (projectExport.s3Path) {
    const fileToDelete = projectExport.s3Path;
    const deleteRes = await deleteS3Files(fileToDelete)
    if (deleteRes.$metadata.httpStatusCode !== 204) {
      const err = new Error(`Unable to delete observation draft file '${fileToDelete}'`);
      captureException(err);
      console.error(err)
    }
  }

  // delete the db entry
  await prisma.projectExport.delete({
    where: { id: exportId },
  });

  // return success
  setResponseStatus(event, 204);
  return { success: true };
});