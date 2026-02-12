import {
  ensureExportHasData,
  type ExportSettings,
} from "~~/server/utils/projectExports";
import {
  createEmptyProjectExport,
  generateProjectExport,
  finishedProjectExport,
  exportErrored,
} from "~~/server/utils/export";
import { generateFilename } from "~~/server/utils/export/helpers";
import { searchObservationIds } from "~~/server/utils/observations";
import { ExportProjectSchema } from "#shared/schemas/ExportProject";

export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [
    "OWNER",
    "INVITED",
  ]);
  // get project id from url parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const project = await getProjectById(projectId, {
    storageLimit: true,
    contributorsCanExport: true,
    id: true,
  });

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project export was not found",
    });
  }

  // fetch role to ensure either owner or project.contributorsCanExport
  const projectAccess = await getProjectAccess(user.id, projectId);

  const isOwner = projectAccess?.role === "OWNER";
  if (!isOwner && !project.contributorsCanExport) {
    throw createError({
      statusCode: 400,
      statusMessage: "Exporting is disabled for all except the project owner",
    });
  }

  // fetch existing exports for calculating storage usage
  const existingExports = await getProjectExportsByProjectId(projectId, {
    size: true,
  });

  const storageUsage = existingExports.reduce(
    (sum: number, current: { size: number }) => current.size + sum,
    0,
  );
  if (storageUsage > project.storageLimit) {
    throw createError({
      statusCode: 400,
      statusMessage: "You don't have enough storage. Please delete some files",
    });
  }

  // get query values with valid defaults
  const queryParams = getQuery(event);
  const exportSettings: ExportSettings =
    await ExportProjectSchema.validate(queryParams);

  // verify there are any observations in this export
  const start = new Date(exportSettings.startDate);
  const end = new Date(exportSettings.endDate);

  const observationIds = await searchObservationIds(projectId, start, end);

  console.log("got observation ids for export", observationIds);

  // ensure there will be any observations in this export
  await ensureExportHasData(observationIds, exportSettings);

  // create empty export file record
  const filename = generateFilename(projectId, exportSettings.type);
  const { id } = await createEmptyProjectExport(
    projectId,
    user.id,
    filename,
    exportSettings,
    observationIds.length,
    canUseS3(),
  );

  // begin generating file while responding to user early
  // NOTE: not awaiting this
  generateProjectExport(event, projectId, user.id, exportSettings)
    .then((exportMeta) => finishedProjectExport(id, exportMeta))
    .catch((err) => exportErrored(id, err));

  // return OK even though we don't know yet
  setResponseStatus(event, 201);
});
