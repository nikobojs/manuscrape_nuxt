import { ExportStatus, ProjectRole } from '@prisma-postgres/client';
import { projectExportQuery } from '~/server/utils/prisma';
import { numberBetween } from '~/utils/validate';

export default safeResponseHandler(async (event) => {
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const exportId = parseIntParam(event.context.params?.exportId);

  // get project export
  const projectExport: FullProjectExport | null = await db.projectExport.findUnique({
    where: {
      id: exportId,
      projectId
    },
    select: projectExportQuery,
  });

  // ensure exists
  if (!projectExport) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project export was not found',
    });
  }

  // return project export
  setResponseStatus(event, 200);
  return projectExport;
});