import { ExportStatus, ProjectRole } from '@prisma-postgres/client';
import { projectExportQuery } from '~/server/utils/prisma';
import { numberBetween } from '~/utils/validate';

export default safeResponseHandler(async (event) => {
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER])

  // get project id from url parameters
  const projectId = parseIntParam(event.context.params?.projectId);

  const take = queryParam<number>({
    name: 'take',
    event: event,
    defaultValue: 10,
    parse: (v: string) => parseInt(v),
    validate: numberBetween(1, 21),
    required: true,
  });
  const skip = queryParam<number>({
    name: 'skip',
    event: event,
    defaultValue: 0,
    parse: (v: string) => parseInt(v),
    validate: numberBetween(0, 1999999999),
    required: true,
  });

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { storageLimit: true },
  });

  // ensure project exists
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project was not found',
    });
  }

  // fetch existing exports for calculating storage usage
  const existingExports = await db.projectExport.findMany({
    where: {
      projectId,
      NOT: {
        status: ExportStatus.ERRORED
      }
    },
    select: {
      size: true,
    },
  });

  const storageUsage = existingExports.reduce((sum, current) => current.size + sum, 0);

  const projectExportsGenerating = await db.projectExport.findMany({
    where: {
      projectId,
      status: ExportStatus.GENERATING,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: projectExportQuery,
  });

  const projectExports: FullProjectExport[] = await db.projectExport.findMany({
    where: {
      projectId,
      NOT: {
        status: ExportStatus.ERRORED
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
    take,
    skip,
    select: projectExportQuery,
  });

  const result: ProjectExportsResponse = {
    projectExports: {
      page: projectExports,
      generating: projectExportsGenerating,
      total: existingExports.length,
    },
    storageUsage,
    storageLimit: project.storageLimit,
  };

  return result;
});
