import { safeResponseHandler } from '../../../../utils/safeResponseHandler';
import { parseIntParam } from '../../../../utils/request';
import { requireUser } from '../../../../utils/authorize';
import { numberBetween } from '~/utils/validate';
import { queryParam } from '~/server/utils/queryParam';
import { observationColumns } from '~/server/utils/prisma';
import { ProjectRole, Prisma } from '@prisma/client';

export default safeResponseHandler(async (event) => {
  // require login
  requireUser(event);
  await ensureURLResourceAccess(event, event.context.user);

  // fetch project access object from db
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

  // require access to project
  if (!projectAccess) {
    // TODO: report error
    throw createError({
      statusCode: 403,
      statusMessage: 'You don\'t have access to this project'
    })
  }

  // define helper variables
  const isOwner = projectAccess.role === ProjectRole.OWNER;

  // define all query parameters
  // TODO: decrease amount of code somehow
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
  const filter = queryParam<'all' | 'published' | 'drafts'>({
    name: 'filter',
    event: event,
    defaultValue: 'all',
    parse: (v: string) => v as 'all' | 'published' | 'drafts',
    validate: (v) => ['all', 'published', 'drafts'].includes(v),
    required: true,
  });
  const ownership = queryParam<'me' | 'everyone'>({
    name: 'ownership',
    event: event,
    defaultValue: 'everyone',
    parse: (v: string) => v as 'me' | 'everyone',
    validate: (v) => ['me', 'everyone'].includes(v),
    required: true,
  });

  // create initial observation where statement
  const whereStatement: Prisma.ObservationWhereInput = {
    projectId,
  }

  // set observation ownership filter in where statement
  // NOTE: only allow project OWNER to see everyone's observations
  if (ownership === 'me' || !isOwner) {
    whereStatement.userId = event.context.user.id;
  }

  // set published/drafts/all filter in where statement
  if (filter === 'drafts') {
    whereStatement.isDraft = true;
  } else if (filter === 'published') {
    whereStatement.isDraft = false;
  }

  // create order by / sorting statement
  const orderByStatement = orderBy === 'createdAt'
    ? { createdAt: orderDirection }
    : { user: { email: orderDirection } };

  // count how many observations where are in total (with filters applied)
  const total = await prisma.observation.count({
    where: whereStatement,
  });

  // make the call
  const result = await prisma.observation.findMany({
    take,
    skip,
    where: whereStatement,
    select: observationColumns,
    orderBy: orderByStatement,
  });

  // return the data!
  return {
    observations: result,
    total,
  };
});
