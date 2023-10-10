import * as yup from 'yup';
import { safeResponseHandler } from '../../../utils/safeResponseHandler';
import { requireUser } from '../../../utils/authorize';


const SupportedExportTypes = Object.freeze({
  nvivo: 'nvivo',
});

export const ExportProjectSchema = yup.object({
  type: yup.string().default(
      () => SupportedExportTypes.nvivo
    ).oneOf(
      Object.keys(SupportedExportTypes)
    ).required(),
}).required();


export default safeResponseHandler(async (event) => {
  console.log('export endpoint called!')
  requireUser(event);

  // get project id  from url parameters
  const projectId = parseIntParam(event.context.params?.projectId);

  // get query values with valid defaults
  const queryParams = await getQuery(event)
  const { type } = await ExportProjectSchema.validate(queryParams);

  if (type === SupportedExportTypes.nvivo ) {
    const buffer = await generateNvivoExport(projectId, event);
    return buffer;
  } else {
    throw createError({
      statusCode: 501,
      statusMessage:
        'Export type is not support yet. Please write on github if you are interested in getting this resolved',
    })
  }
});
