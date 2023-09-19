import jwt from 'jsonwebtoken';
import type { H3Event, EventHandlerRequest } from 'h3';
import { PrismaClient, type User, ProjectRole, Project } from '@prisma/client';
import { getRequestBeginTime, parseIntParam } from './request';
import { useRoute } from 'nuxt/app';

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


export async function getObservationsByProject(
  projectId: number,
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId },
    select: {
      observations: {
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
    event: H3Event<EventHandlerRequest>,
    user: UserInSession,
    allowedRoles = [ProjectRole.OWNER.valueOf(), ProjectRole.INVITED.valueOf()]
): Promise<void> {
  // return early if user is not logged in
  if (!user) {
    // TODO: report error
    throw createError({
      statusCode: 403,
      statusMessage: 'User does not exist',
    });
  }

  const params = getRouterParams(event);
  let projectIdInt: undefined | number;

  // validate params.projectId if it exists
  if (typeof params?.projectId === 'string') {
    // ensure projectId is parsed to integer
    projectIdInt = parseIntParam(params.projectId);

    // validate params.projectId against projectAccess.projectId and projectAccess.role
    const projectAccess = user.projectAccess.find(({ projectId, role }) => 
      projectId === projectIdInt && allowedRoles.includes(role)
    )

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


export async function delayedResponse(
  event: H3Event,
  response: Record<string, any> | (() => Record<string, any>),
  responseTimeMs: number = config.app.authResponseTime,
): Promise<Record<string, any>> {
  const nowMs = new Date().getTime();
  const startTime = getRequestBeginTime(event)
  const alreadyTookMs = nowMs - startTime;
  
  // calculate how many ms response should be delayed
  let waitMs = responseTimeMs - alreadyTookMs;
  if (waitMs < 0) waitMs = 0;

  return new Promise((r) => setTimeout(() => {
    // if response from argument is a function, return function's response
    // else, just return whatever response is
    if (typeof response === 'function') {
      response = response() as Record<string, any>;
      r(response);
    } else {
      r(response);
    }
  }, waitMs));
}


export async function delayedError(
  event: H3Event,
  statusCode: number,
  statusMessage: string,
  _report: boolean = false,
  responseTimeMs: number = config.app.authResponseTime,
) {
  // TODO: report error
  return await delayedResponse(event, () =>
    createError({
      statusCode,
      statusMessage
    }),
    responseTimeMs
  );
}


export function isValidEmail(email: string): boolean {
  return !!email && /.+\@.+\..+/.test(email);
}


// server-side password validation function
export function passwordStrongEnough(
  pw: string
) : {valid: boolean, reason: string} {
  if (!pw) return {
    valid: false,
    reason: 'No password was provided'
  };

  // min length
  if (pw.length < 6) return {
    valid: false,
    reason: 'Password must contain at least 6 characters'
  };

  // everything except ordinary letters
  if (!/[^a-zA-Z]/.test(pw)) {
    return {
      valid: false,
      reason: 'Password must contain at least one number or symbol',
    }
  }

  // at least one letter
  if (!/[a-zA-Z]/.test(pw)) {
    return {
      valid: false,
      reason: 'Password must contain at least one letter',
    }
  }

  return { valid: true, reason: '' };
}
