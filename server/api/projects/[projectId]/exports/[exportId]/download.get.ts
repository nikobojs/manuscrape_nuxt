import { exportIsDownloadable } from "~~/server/utils/export/helpers";

export default safeResponseHandler(async (event) => {
  // ensure auth and access is ok
  const user = await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [
    "OWNER",
    "INVITED",
  ]);

  // get integer parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const exportId = parseIntParam(event.context.params?.exportId);

  const projectExport = await getProjectExportById(exportId, {
    filePath: true,
    isS3: true,
    status: true,
    mimetype: true,
    type: true,
    error: true,
  });
  if (!projectExport) {
    throw createError({
      statusCode: 404,
      statusMessage: "Project export was not found",
    });
  }

  // fetch role to ensure either owner or project.contributorsCanExport
  const projectAccess = await ensureProjectAccess(user.id, projectId);

  const project = await getProjectById(projectId, {
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

  if (!exportIsDownloadable(projectExport)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project export is not ready for download yet",
    });
  }

  // set http header that fixes control over the download filename
  const filename = projectExport.filePath!.split("/").reverse()[0];
  setHeader(event, "Content-Disposition", `attachment; filename="${filename}"`);
  setHeader(event, "Content-Type", projectExport.mimetype);

  // fetch export from s3 and return it
  const { readable, s3 } = await getUpload(
    projectExport.filePath,
    projectExport.isS3,
  );

  // clean up open sockets just in case
  readable.on("end", () => {
    if (s3) s3.destroy();
  });
  readable.on("close", () => {
    if (s3) s3.destroy();
  });

  return readable;
});
