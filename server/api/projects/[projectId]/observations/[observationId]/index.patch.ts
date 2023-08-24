import { PrismaClient } from '@prisma/client';
import * as yup from 'yup';
import { requireUser } from '../../../../../utils/authorize';
import { parseIntParam } from '../../../../../utils/request';

const prisma = new PrismaClient();
const patchObservationSchema = yup.object({
  isDraft: yup.bool().optional(),
  data: yup.object().optional(),
}).required()


export default safeResponseHandler(async (event) => {
  requireUser(event);
  const params = event.context.params
  const observationId = parseIntParam(params?.observationId);

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
