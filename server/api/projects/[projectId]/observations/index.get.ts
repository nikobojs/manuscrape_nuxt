import { PrismaClient } from '@prisma/client';
import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { parseIntParam } from '../../../../utils/request';
import { requireUser } from '../../../../utils/authorize';
import { numberBetween } from '~/utils/validate';
import { queryParam } from '~/server/utils/queryParam';
import { observationColumns } from '~/server/utils/prisma';

const prisma = new PrismaClient();

export default safeResponseHandler(async (event) => {
  requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
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
    },
  });

  const result = await prisma.observation.findMany({
    take,
    skip,
    where: {
      projectId: projectId,
    },
    select: observationColumns,
  });

  return {
    observations: result,
    total,
  };
});
