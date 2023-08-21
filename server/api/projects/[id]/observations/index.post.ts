import { PrismaClient } from '@prisma/client';
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';

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

  if (isNaN(projectId)) {
    return createError({
      statusCode: 400,
      statusMessage: 'Invalid project id',
    });
  }

  const data = await readBody(event);


  // TODO: validate with zod?

  const result = await prisma.observation.create({
    data: {
      data,
      userId: event.context.auth.id,
      projectId: projectId,
    }
  });

  return {
    id: result.id,
    msg: 'observation created!'
  }
})
