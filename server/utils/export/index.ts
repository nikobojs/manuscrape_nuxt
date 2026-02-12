import type { H3Event } from "h3";
import { generateProjectMediaExport } from "./media";
import { generateNvivoExport } from "./nvivo";
import { generateProjectUploadsExport } from "./uploads";
import { observations, projectExports } from "~~/server/drizzle/schema";
import { and, eq, gte, lte, SQL } from "drizzle-orm";

export async function generateProjectExport(
  event: H3Event,
  projectId: number,
  userId: number,
  config: ExportProjectPayload,
): Promise<ExportMeta> {
  // get the correct export function based on json body
  const { type, startDate, endDate, includeTags } = config;

  // create basic observation filter for export (published & related to project)
  const obsFilters: SQL<unknown>[] = [
    eq(observations.projectId, projectId),
    eq(observations.isDraft, false),
  ];

  // add startDate and endDate if defined
  if (startDate) {
    obsFilters.push(gte(observations.createdAt, new Date(startDate)));
  }
  if (endDate) {
    obsFilters.push(lte(observations.createdAt, new Date(endDate)));
  }

  // make into one big WHERE .. AND .. statement
  const observationFilter: SQL<unknown> = and(...obsFilters)!; // we know obsFilters.length > 0

  if (type === "NVIVO") {
    return generateNvivoExport(
      event,
      projectId,
      observationFilter,
      includeTags,
    );
  } else if (type === "MEDIA") {
    return generateProjectMediaExport(event, projectId, observationFilter);
  } else if (type === "UPLOADS") {
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
  return db
    .insert(projectExports)
    .values({
      endDate: new Date(settings.endDate),
      startDate: new Date(settings.startDate),
      userId,
      projectId,
      type: settings.type,
      mimetype: "",
      filePath,
      isS3,
      observationsCount,
      size: 0,
      status: "GENERATING",
    })
    .returning({ id: projectExports.id })
    .then((x) => x[0]!);
}

export function finishedProjectExport(exportId: number, meta: ExportMeta) {
  return db
    .update(projectExports)
    .set({ ...meta, status: "DONE" })
    .where(eq(projectExports.id, exportId));
}

export async function exportErrored(
  exportId: number,
  err?: string | Error,
): Promise<void> {
  const errMsg = err instanceof Error ? err.message : err;
  console.trace(`"Project export ${exportId} failed with err:`, errMsg);
  await db
    .update(projectExports)
    .set({
      error: errMsg || "Unknown error",
      status: "ERRORED",
    })
    .where(eq(projectExports.id, exportId));
}
