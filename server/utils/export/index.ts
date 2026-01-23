import type { H3Event } from "h3";
import { Prisma } from "@prisma-postgres/client";
import { generateProjectMediaExport } from "./media";
import { generateNvivoExport } from "./nvivo";
import { generateProjectUploadsExport } from "./uploads";

export async function generateProjectExport(
  event: H3Event,
  projectId: number,
  userId: number,
  config: ExportProjectPayload,
): Promise<ExportMeta> {
  // get the correct export function based on json body
  const { type, startDate, endDate, includeTags } = config;

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

  if (type === ExportType.NVIVO) {
    return generateNvivoExport(
      event,
      projectId,
      observationFilter,
      includeTags,
    );
  } else if (type === ExportType.MEDIA) {
    return generateProjectMediaExport(event, projectId, observationFilter);
  } else if (type === ExportType.UPLOADS) {
    return generateProjectUploadsExport(event, projectId, observationFilter);
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: "Export type is not supported.",
    });
  }
}

export async function createEmptyProjectExport(
  projectId: number,
  userId: number,
  filePath: string,
  settings: ExportProjectPayload,
  observationsCount: number,
  isS3: boolean,
): Promise<{ id: number }> {
  const res = await db.projectExport.create({
    data: {
      userId,
      projectId,
      type: settings.type,
      startDate: new Date(settings.startDate).toISOString(),
      endDate: new Date(settings.endDate).toISOString(),
      status: ExportStatus.GENERATING,
      mimetype: "",
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
  const errMsg = err instanceof Error ? err.message : err;
  console.error("Project export failed with err:", errMsg);
  await db.projectExport.update({
    data: {
      error: errMsg || "Unknown error",
      status: ExportStatus.ERRORED,
    },
    where: {
      id: exportId,
    },
  });
}
