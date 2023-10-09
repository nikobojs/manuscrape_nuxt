import * as yup from 'yup';

const patchObservationSchema = yup.object({
  isDraft: yup.bool().optional(),
  data: yup.object().optional(),
}).required()


export default safeResponseHandler(async (event) => {
  requireUser(event);
  const params = event.context.params
  const observationId = parseIntParam(params?.observationId);
  const projectId = parseIntParam(params?.projectId);
  await ensureURLResourceAccess(event, event.context.user);

  const body = await readBody(event);
  let patch = await patchObservationSchema.validate(body);
  patch = removeKeysByUndefinedValue(patch);

  // fetch existing observation
  const observation = await prisma.observation.findUnique({
    select: {
      id: true,
      isDraft: true,
      projectId: true,
    },
    where: {
      id: observationId,
    }
  });

  // if it does not exist, then throw up
  if (!observation || observation.projectId !== projectId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Observation was not found',
    })
  }

  // ensure observation cannot be updated if it isn't a draft any more
  if (!observation.isDraft) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not allowed to patch locked observations',
    });
  }

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


// TODO: move to util
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
