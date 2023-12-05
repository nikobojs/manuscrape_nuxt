import { ProjectRole } from '@prisma/client';
import * as yup from 'yup';
import { generateProjectUploadsExport } from '~/server/utils/export';

const SupportedExportTypes = Object.freeze({
  nvivo: 'nvivo',
  uploads: 'uploads',
  media: 'media',
});

export const ExportProjectSchema = yup.object({
  type: yup.string().default(
      () => SupportedExportTypes.nvivo
    ).oneOf(
      Object.keys(SupportedExportTypes)
    ).required(),
}).required();


export default safeResponseHandler(async (event) => {
  await requireUser(event);
  await ensureURLResourceAccess(event, event.context.user, [ProjectRole.OWNER])

  // get project id  from url parameters
  const projectId = parseIntParam(event.context.params?.projectId);

  // get query values with valid defaults
  const queryParams = await getQuery(event)
  const { type } = await ExportProjectSchema.validate(queryParams);

  if (type === SupportedExportTypes.nvivo ) {
    const buffer = await generateNvivoExport(projectId, event);
    return buffer;
  } else if(type === SupportedExportTypes.media) {
    const buffer = await generateProjectMediaExport(event, projectId);
    return buffer;
  } else if(type === SupportedExportTypes.uploads) {
    const buffer = await generateProjectUploadsExport(event, projectId);
    return buffer;
  } else {
    throw createError({
      statusCode: 501,
      statusMessage:
        'Export type is not support yet. Please write on github if you are interested in getting this resolved',
    })
  }
});
