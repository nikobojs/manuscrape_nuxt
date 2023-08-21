import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
  if (!event.context.auth?.id) {
      throw createError({
          statusMessage: 'Invalid auth token value',
          statusCode: 401,
      });
  }
    
  const param = event.context.params
  const projectId = parseInt(param?.id || '');
  const draftId = parseInt(param?.draftId || '');

  if (isNaN(projectId)) {
    return createError({
      statusCode: 400,
      statusMessage: 'Invalid project id',
    });
  }
  if (isNaN(draftId)) {
    return createError({
      statusCode: 400,
      statusMessage: 'Invalid observation draft id',
    });
  }

  const body = await readBody(event);

  // TODO: validate patch with zod

  const result = await prisma.observationDraft.findFirst({
    select: {
      id: true,
    }, where: {
      id: draftId,
      userId: event.context.auth?.id,
    }
  });

  return result;
})
