import { numberBetween } from "#shared/utils/validate";
import {
  getProjectExportsByProjectId,
  getProjectExportsGenerating,
  getProjectExportsPaginated,
} from "~~/server/utils/projectExports";

export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [
    "OWNER",
    "INVITED",
  ]);

  // get project id from url parameters
  const projectId = parseIntParam(event.context.params?.projectId);

  // fetch role to ensure either owner or project.contributorsCanExport
  const projectAccess = await ensureProjectAccess(user.id, projectId);

  const project = await getProjectById(projectId, {
    storageLimit: true,
    contributorsCanExport: true,
  });

  // ensure project exists
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project was not found",
    });
  }

  const isOwner = projectAccess?.role === "OWNER";
  if (!isOwner && !project.contributorsCanExport) {
    throw createError({
      statusCode: 403,
      statusMessage: "Exporting is disabled for all except the project owner",
    });
  }

  const take = queryParam<number>({
    name: "take",
    event: event,
    defaultValue: 10,
    parse: (v: string) => parseInt(v),
    validate: numberBetween(1, 21),
    required: true,
  }) as number;

  const skip = queryParam<number>({
    name: "skip",
    event: event,
    defaultValue: 0,
    parse: (v: string) => parseInt(v),
    validate: numberBetween(0, 1999999999),
    required: true,
  }) as number;

  // fetch existing exports for calculating storage usage
  const existingExports = await getProjectExportsByProjectId(projectId, {
    size: true,
  });

  const storageUsage = existingExports.reduce(
    (sum, current) => current.size + sum,
    0,
  );

  const projectExportsGenerating = await getProjectExportsGenerating(projectId);
  const projectExportsPage: FullProjectExport[] =
    await getProjectExportsPaginated(projectId, take, skip);

  const result: ProjectExportsResponse = {
    projectExports: {
      page: projectExportsPage,
      generating: projectExportsGenerating,
      total: existingExports.length,
    },
    storageUsage,
    storageLimit: project.storageLimit,
  };

  return result;
});
