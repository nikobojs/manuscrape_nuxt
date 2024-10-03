import type { H3Event } from 'h3';
import { Prisma } from '@prisma-postgres/client';
import { ExportStatus, ExportType } from '@prisma-postgres/client';

export async function generateProjectExport(
  event: H3Event,
  projectId: number,
  userId: number,
  config: ExportProjectPayload
): Promise<ExportMeta> {
  // get the correct export function based on json body
  const { type, startDate, endDate } = config;
  let generateExportFn: ExportFn;

  if (type === ExportType.NVIVO ) {
    generateExportFn = generateNvivoExport;
  } else if(type === ExportType.MEDIA) {
    generateExportFn = generateProjectMediaExport;
  } else if(type === ExportType.UPLOADS) {
    generateExportFn = generateProjectUploadsExport;
  } else {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Export type is not supported.',
    });
  }

  // create basic observation filter for export (published & related to project)
  const observationFilter: Prisma.ObservationWhereInput = {
    projectId,
    isDraft: false,
  };

  // add startDate and endDate if defined
  if (startDate || endDate) {
    observationFilter.createdAt = {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    };
  }

  return generateExportFn(event, projectId, observationFilter)
}

export async function createEmptyProjectExport(
  projectId: number,
  userId: number,
  filePath: string,
  settings: ExportProjectPayload,
  observationsCount: number,
  isS3: boolean,
): Promise<{id: number}> {
  const res = await db.projectExport.create({
    data: {
      userId,
      projectId,
      type: settings.type,
      startDate: new Date(settings.startDate).toISOString(),
      endDate: new Date(settings.endDate).toISOString(),
      status: ExportStatus.GENERATING,
      mimetype: '',
      filePath,
      isS3,
      observationsCount,
      size: 0,
    },
    select: {
      id: true,
    },
  });
  return res;
}

export async function finishedProjectExport(
  exportId: number,
  meta: ExportMeta,
): Promise<void> {
  await db.projectExport.update({
    data: {
      ...meta,
      status: ExportStatus.DONE,
    },
    where: {
      id: exportId,
    },
  });
}

export async function exportErrored(
  exportId: number,
  err?: string | Error,
): Promise<void> {
  const errMsg = err instanceof Error ? err.message : err
  await db.projectExport.update({
    data: {
      error: errMsg || 'Unknown error',
      status: ExportStatus.ERRORED,
    },
    where: {
      id: exportId,
    },
  });
}