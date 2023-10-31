import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { parseIntParam } from '../../../../utils/request';
import { requireUser } from '../../../../utils/authorize';
import { numberBetween } from '~/utils/validate';
import { queryParam } from '~/server/utils/queryParam';
import { observationColumns } from '~/server/utils/prisma';
import { ProjectRole } from '@prisma/client';

export default safeResponseHandler(async (event) => {
  requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);
  const projectId = parseIntParam(event.context.params?.projectId);
  const projectAccess = await prisma.projectAccess.findFirst({
    select: {
      role: true,
    },
    where: {
      projectId,
      userId: event.context.user.id,
    }
  });

  if (!projectAccess) {
    // TODOL report error
    throw createError({
      statusCode: 403,
      statusMessage: 'You don\'t have access to this project'
    })
  }

  const isOwner = projectAccess.role === ProjectRole.OWNER;

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
  const orderDirection = queryParam<'asc' | 'desc'>({
    name: 'orderDirection',
    event: event,
    defaultValue: 'desc',
    parse: (v) => v as 'asc' | 'desc',
    validate: (v) => ['asc', 'desc'].includes(v),
    required: true,
  });
  const orderBy = queryParam<'user' | 'createdAt'>({
    name: 'orderBy',
    event: event,
    defaultValue: 'createdAt',
    parse: (v) => v as 'user' | 'createdAt',
    validate: (v) => ['user', 'createdAt'].includes(v),
    required: true,
  });

  const total = await prisma.observation.count({
    where: {
      projectId: projectId,
    },
  });

  const orderByStatement = orderBy === 'createdAt'
    ? { createdAt: orderDirection }
    : { user: { email: orderDirection } };

  const whereStatement = (isOwner ? {
    projectId
  } : {
    userId: event.context.user.id,
    projectId
  })

  const result = await prisma.observation.findMany({
    take,
    skip,
    where: whereStatement,
    select: observationColumns,
    orderBy: orderByStatement,
  });

  return {
    observations: result,
    total,
  };
});
