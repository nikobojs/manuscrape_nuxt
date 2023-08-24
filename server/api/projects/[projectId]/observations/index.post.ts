import { PrismaClient } from '@prisma/client';
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { parseIntParam } from '../../../../utils/request';
import { requireUser } from '../../../../utils/authorize';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
  const user = requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);

  const result = await prisma.observation.create({
    data: {
      userId: user.id,
      projectId: projectId,
      isDraft: true,
      data: {}
    }
  });

  return {
    id: result.id,
    msg: 'observation created!'
  }
})
