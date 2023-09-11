import { PrismaClient } from '@prisma/client';
import { safeResponseHandler } from '~/server/utils/safeResponseHandler';
const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
  requireUser(event);
  const observationId = parseIntParam(event.context.params?.observationId);
  const observation = await prisma.observation.findUnique({
    where: {
      id: observationId
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

  return observation;
});