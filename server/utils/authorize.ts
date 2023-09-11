import jwt from 'jsonwebtoken';
import type { H3Event, EventHandlerRequest } from 'h3';
import { PrismaClient, type User, ProjectRole, Project } from '@prisma/client';
import { parseIntParam } from './request';

const config = useRuntimeConfig();
const prisma = new PrismaClient();

export async function authorize(
  event: H3Event,
  user: User
): Promise<{ token: string }> {
  const expires = new Date(new Date().setDate(new Date().getDate() + 365))
  event.context.user = user;
  const token = await jwt.sign({ id: user.id }, config.app.tokenSecret);

  setCookie(event, 'authcookie', token, {
    expires,
    httpOnly: true,
    domain: config.app.COOKIE_DOMAIN,
    sameSite: 'strict'
  });

  return { token };
}

export function requireUser(
  event: H3Event<EventHandlerRequest>
): User {
  if (!event.context.user?.id) {
      throw createError({
          statusMessage: 'Invalid auth token value',
          statusCode: 401,
      });
  }

  return event.context.user as User;
}


export async function getProjectsByUser(
  userId: number,
) {
  const user = await prisma.user.findFirst({
    where: {id: userId},
    select: {
      projectAccess: {
        select: {
          project: true,
          role: true
        }
      }
    }
  });

  const allowedRoles = [ProjectRole.OWNER, ProjectRole.INVITED];

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'User does not exist',
    })
  }

  const projects = user?.projectAccess.reduce((acc, cur) => {
    if (allowedRoles.includes(cur.role)) {
      acc.push(cur.project);
    }

    return acc;
  }, [] as Project[]);

  return projects;
}


export async function getObservationsByProject(
  projectId: number,
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId },
    select: {
      observations: {
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          createdAt: true,
          data: true,
          image: true,
          isDraft: true,
          uploadInProgress: true,
          updatedAt: true
        }
      }
    }
  });

  if (!project) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Project does not exist',
    })
  }


  return project?.observations;
}


export async function ensureURLResourceAccess(
    event: H3Event<EventHandlerRequest>
): Promise<void> {
  // return early if user is not logged in
  if (!event.context.user) {
    return
  }

  const user = event.context.user as UserInSession;
  const params = event.context.params;
  let projectIdInt: undefined | number;

  // validate params.projectId if it exists
  if (typeof params?.projectId === 'string') {
    // ensure projectId is parsed to integer
    projectIdInt = parseIntParam(params.projectId);

    // validate params.projectId against projectAccess.projectId and projectAccess.role
    const projectAccess = user.projectAccess.find(({ projectId, role }) => {
      return projectId === projectIdInt && ['FULL_ACCESS'].includes(role)
    })

    // throw error if user doesn't have access to project
    if (!projectAccess) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You don\'t have access to this project',
      });
    }
  }

  // validate params.observationId if it exists
  if (projectIdInt && typeof params?.observationId === 'string') {
    // ensure observationId is parsed to integer
    const observationIdInt = parseIntParam(params.observationId);

    // get observations beloning to project
    const observations = await getObservationsByProject(projectIdInt)
    const hasAccess = observations.find((o) => o.id === observationIdInt);
    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You don\'t have access to this observation'
      })
    }
  }
}