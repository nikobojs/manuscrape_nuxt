import { PrismaClient } from '@prisma/client';
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { parseIntParam } from '../../../../utils/request';
import { requireUser } from '../../../../utils/authorize';
import { numberBetween } from '~/utils/validate';
import { queryParam } from '~/server/utils/queryParam';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
  requireUser(event);
  const projectId = parseIntParam(event.context.params?.projectId);
  const take = queryParam<number>({
    name: 'take',
    event: event,
    defaultValue: 10,
    parse: (v: string) => parseInt(v),
    validate: numberBetween(1, 21),
    required: true,
  });
  const skip = queryParam<number>({
    name: 'skip',
    event: event,
    defaultValue: 0,
    parse: (v: string) => parseInt(v),
    validate: numberBetween(0, 1999999999),
    required: true,
  });

  const total = await prisma.observation.count({
    where: {
      projectId: projectId,
      deletedAt: null,
    },
  })

  const result = await prisma.observation.findMany({
    take,
    skip,
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
    total,
  }
});
