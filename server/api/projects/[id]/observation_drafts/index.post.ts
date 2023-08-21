import { PrismaClient } from '@prisma/client';
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event: any) => {
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

  const body = await readBody(event);

  // TODO: validate body using zod

  const result = await prisma.observationDraft.create({
    data: {
      projectId,
      userId: event.context.auth?.id,
      uploadInProgress: !!body?.addFile,
      data: {},
    }
  });

  return {
    id: result.id,
    msg: 'observation draft created!'
  }
})
