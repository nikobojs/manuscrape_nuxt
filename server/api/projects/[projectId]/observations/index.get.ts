import { PrismaClient } from '@prisma/client';
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { parseIntParam } from '../../../../utils/request';
import { requireUser } from '../../../../utils/authorize';

const prisma = new PrismaClient();

// TODO add pagination support
export default safeResponseHandler(async (event) => {
  requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);

  const result = await prisma.observation.findMany({
    where: {
      projectId: projectId,
      deletedAt: null,
    },
    select: {
      createdAt: true,
      data: true,
      id: true,
      imageId: true,
      isDraft: true,
      updatedAt: true,
      uploadInProgress: true,
      image: {
        select: {
          id: true,
          createdAt: true,
          mimetype: true,
          originalName: true,
        }
      },
      user: {
        select: {
          email: true
        }
      }
    }
  });

  return {
    observations: result,
  }
});
