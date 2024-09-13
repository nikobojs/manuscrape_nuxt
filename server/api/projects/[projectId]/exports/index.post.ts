import { ExportStatus, ExportType, ProjectRole } from '@prisma/client';
import * as yup from 'yup';
import { createEmptyProjectExport, exportErrored } from '~/server/utils/export';

export const ExportProjectSchema = yup.object({
  type: yup.mixed<ExportType>().oneOf(
    Object.values(ExportType)
  ).required(),
  startDate: yup.string().required().test((s) => !isNaN(new Date(s).getDate())),
  endDate: yup.string().required().test((s) => !isNaN(new Date(s).getDate())),
}).required();

export default safeResponseHandler(async (event) => {
  const user = await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER])
  // get project id from url parameters
  const projectId = parseIntParam(event.context.params?.projectId);
  const project = await prisma.project.findUnique({
    select: {
      id: true,
      storageLimit: true,
    },
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project export was not found',
    });
  }
  
  // fetch existing exports for calculating storage usage
  const existingExports = await prisma.projectExport.findMany({
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
  if (storageUsage > project.storageLimit) {
    throw createError({
      statusCode: 400,
      statusMessage: 'You don\'t have enough storage. Please delete some files',
    });
  }

  // get query values with valid defaults
  const queryParams = getQuery(event)
  const exportSettings = await ExportProjectSchema.validate(queryParams);

  // verify there are any observations in this export
  const start = new Date(exportSettings.startDate); 
  const end = new Date(exportSettings.endDate);
  const count = await prisma.observation.count({
    where: {
      AND: [
        { projectId: { equals: projectId }},
        { createdAt: { gte: start } },
        { createdAt: { lte: end } }
      ]
    }
  });

  // ensure there will be any observations in this export
  if (count === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'There are no observations in this project within the given time interval',
    });
  }

  // create empty export file record
  const filename = generateFilename(projectId, exportSettings.type);
  const { id } = await createEmptyProjectExport(
    projectId,
    user.id,
    filename,
    exportSettings,
    count,
  );

  // begin generating file while responding to user early
  // NOTE: not awaiting this
  generateProjectExport(
    event,
    projectId,
    user.id,
    exportSettings,
  )
    .then((exportMeta) => finishedProjectExport(id, exportMeta))
    .catch((err) => exportErrored(id, err));

  // return OK even though we don't know yet
  setResponseStatus(event, 201);
});
