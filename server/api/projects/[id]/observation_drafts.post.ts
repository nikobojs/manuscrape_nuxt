import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  if (!event.context.auth?.id) {
      throw createError({
          statusMessage: 'Invalid auth token value',
          statusCode: 401,
      });
  }
    
  const param = event.context.params
  const projectId = parseInt(param?.id || '');

  if (isNaN(projectId)) {
    return createError({
      statusCode: 400,
      statusMessage: 'Invalid project id',
    });
  }


  const result = await prisma.observationDraft.create({
    data: {
      projectId,
      userId: event.context.auth?.id,
      data: {},
    }
  });

  return {
    id: result.id,
    msg: 'observation draft created!'
  }
})
