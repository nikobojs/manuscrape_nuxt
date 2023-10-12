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

  const total = await prisma.observation.count({
    where: {
      projectId: projectId,
    },
  });

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
  });

  return {
    observations: result,
    total,
  };
});
