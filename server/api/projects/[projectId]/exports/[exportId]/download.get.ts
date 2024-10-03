import { ExportStatus, ProjectRole } from '@prisma-postgres/client'
import { safeResponseHandler } from '../../../../../utils/safeResponseHandler';
import { requireUser } from '../../../../../utils/authorize';
import { exportIsDownloadable } from '~/server/utils/export/helpers';

export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const exportId = parseIntParam(event.context.params?.exportId);

  const projectExport = await db.projectExport.findUnique({
    where: {
      id: exportId,
      projectId
    },
    select: {
      filePath: true,
      isS3: true,
      status: true,
      mimetype: true,
      type: true,
      error: true,
    },
  });
  if (!projectExport) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project export was not found',
    })
  }
  if (!exportIsDownloadable(projectExport)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project export is not ready for download yet',
    })
  }

  // set http header that fixes control over the download filename
  const filename = projectExport.filePath!.split('/').reverse()[0];
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`);
  setHeader(event, 'Content-Type', projectExport.mimetype);

  // fetch export from s3 and return it
  const res = await getUpload(projectExport.filePath, projectExport.isS3);
  return res;
});
