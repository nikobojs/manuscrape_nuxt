import { PrismaClient } from '@prisma/client';
import * as yup from 'yup';

const prisma = new PrismaClient();
const patchObservationSchema = yup.object({
  isDraft: yup.bool().optional(),
  data: yup.object().optional(),
}).required()


export default safeResponseHandler(async (event) => {
  if (!event.context.auth?.id) {
      throw createError({
          statusMessage: 'Invalid auth token value',
          statusCode: 401,
      });
  }
    
  const param = event.context.params
  const projectId = parseInt(param?.id || '');
  const observationId = parseInt(param?.observationId || '');

  if (isNaN(projectId)) {
    return createError({
      statusCode: 400,
      statusMessage: 'Invalid project id',
    });
  }
  if (isNaN(observationId)) {
    return createError({
      statusCode: 400,
      statusMessage: 'Invalid observation draft id',
    });
  }

  const body = await readBody(event);
  let patch = await patchObservationSchema.validate(body);
  patch = removeKeysByUndefinedValue(patch);

  const result = await prisma.observation.update({
    select: {
      id: true,
    }, where: {
      id: observationId,
    }, data: {
      ...patch,
      updatedAt: new Date().toISOString(),
    }
  });

  return {
    id: result.id,
    msg: 'observation draft patched!'
  }
})


function removeKeysByUndefinedValue(
  obj: Record<string, any>
): Record<string, any> {
  const result = {} as Record<string, any>;
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}
