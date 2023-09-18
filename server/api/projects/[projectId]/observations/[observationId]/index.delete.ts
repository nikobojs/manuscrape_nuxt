import { PrismaClient } from '@prisma/client';
import { requireUser } from '../../../../../utils/authorize';
import { parseIntParam } from '../../../../../utils/request';

const prisma = new PrismaClient();


export default safeResponseHandler(async (event) => {
  requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
  const params = event.context.params
  const observationId = parseIntParam(params?.observationId);
  const projectId = parseIntParam(params?.projectId);

  // fetch existing observation
  const observation = await prisma.observation.findUnique({
    select: {
      id: true,
      isDraft: true,
    },
    where: {
      id: observationId,
    }
  });

  // if it does not exist, then throw up
  if (!observation) {
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

  await prisma.observation.delete({
    where: { id: observationId, projectId },
  });


  return {
    msg: 'observation has been deleted!',
  };
});
