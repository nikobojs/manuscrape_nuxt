import jwt from "jsonwebtoken";
import type { H3Event, EventHandlerRequest } from "h3";
import type { CookieOptions } from "nuxt/app";
import { getRequestBeginTime, parseIntParam } from "./request";
import { captureException } from "@sentry/node";

const config = useRuntimeConfig();

export function updateAuthCookie(
  event: H3Event<EventHandlerRequest>,
  token: string | null, // set to null if log out
  expiresAt?: Date | undefined,
): void {
  if (!token) {
    token = "";
    expiresAt = new Date(0);
  }

  const flags: CookieOptions = {
    expires: expiresAt,
    httpOnly: true,
    domain: config.cookieDomain,
    sameSite: "strict",
    secure: config.cookieSecure,
  };

  setCookie(event, "authcookie", token, flags);
}

export function resetAuthCookie(event: H3Event<EventHandlerRequest>) {
  return updateAuthCookie(event, null);
}

export async function authorize(
  event: H3Event,
  user: User,
): Promise<{ token: string }> {
  const expires = new Date(new Date().setDate(new Date().getDate() + 365));
  event.context.user = user;
  const token = jwt.sign({ id: user.id }, config.tokenSecret);

  updateAuthCookie(event, token, expires);

  return { token };
}

export async function requireUser(
  event: H3Event<EventHandlerRequest>,
): Promise<User> {
  if (!event.context.user?.id) {
    throw createError({
      statusMessage: "Invalid auth token value",
      statusCode: 401,
    });
  }

  if (!event.context.user?.email) {
    // TODO: why is email not kept between requests?
    console.warn(
      "refetching user as only id missing in H3Event context (FIXME)",
    );
    const user = await getFullUserById(event.context.user.id);
    event.context.user = user;
  }
  return event.context.user as User;
}

export async function ensureObservationOwnership(
  obs: FullObservation,
  user: User,
): Promise<void> {
  if (obs.user?.email !== user.email) {
    throw createError({
      statusCode: 401,
      statusMessage: "You do not have access to this observation",
    });
  }
}

export async function ensureURLResourceAccess(
  event: H3Event<EventHandlerRequest>,
  user: CurrentUser,
  allowedRoles: ProjectRole[] = ["OWNER", "INVITED"],
): Promise<void> {
  // return early if user is not logged in
  if (!user) {
    const err = createError({
      statusCode: 403,
      statusMessage: "User does not exist",
    });
    captureException(err);
    throw err;
  }

  const params = getRouterParams(event);
  let projectIdInt: undefined | number;
  let contributorsCanReadAllObservations = false;

  // validate params.projectId if it exists
  let role: ProjectRole = "INVITED"; // TODO: fix this weird default
  if (typeof params?.projectId === "string") {
    // ensure projectId is parsed to integer
    projectIdInt = parseIntParam(params.projectId);

    // validate params.projectId against projectAccess.projectId and projectAccess.role
    const projectAccess = user.projectAccess.find(({ project, role }) => {
      return project.id === projectIdInt && allowedRoles.includes(role);
    });

    // throw error if user doesn't have access to project
    if (!projectAccess) {
      const err = createError({
        statusCode: 403,
        statusMessage: `You don't have access to project ${projectIdInt}`,
      });
      captureException(err, { user });
      throw err;
    }

    role = projectAccess.role; // not sure if works - 2026-01-31

    contributorsCanReadAllObservations =
      projectAccess.project.contributorsCanReadAllObservations;
  }

  // validate params.observationId if it exists
  if (projectIdInt && typeof params?.observationId === "string") {
    // ensure observationId is parsed to integer
    const observationIdInt = parseIntParam(params.observationId);

    // get observations belonging to project
    const observation = await getObservationById(observationIdInt, {
      id: true,
      userId: true,
    });

    if (!observation) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "You don't have access to this observation or this observation does not exist",
      });
    }

    const isOwner = role === "OWNER";
    if (
      !isOwner &&
      user.id !== observation.userId &&
      !contributorsCanReadAllObservations
    ) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "You don't have the right permission to interact with this observation",
      });
    }
  }
}

export async function delayedResponse(
  event: H3Event,
  response: Record<string, any> | (() => Record<string, any>),
  responseTimeMs: number = config.authResponseTime,
): Promise<Record<string, any>> {
  const startTime = getRequestBeginTime(event);
  const alreadyTookMs = Date.now() - startTime;

  // calculate how many ms response should be delayed
  let waitMs = responseTimeMs - alreadyTookMs;
  if (waitMs < 0) waitMs = 0;

  return new Promise((r) =>
    setTimeout(() => {
      // if response from argument is a function, return function's response
      // else, just return whatever response is
      if (typeof response === "function") {
        response = response() as Record<string, any>;
        r(response);
      } else {
        r(response);
      }
    }, waitMs),
  );
}

export async function delayedError(
  event: H3Event,
  statusCode: number,
  statusMessage: string,
  _report: boolean = false,
  responseTimeMs: number = config.authResponseTime,
) {
  captureException(new Error(statusMessage));
  return await delayedResponse(
    event,
    () =>
      createError({
        statusCode,
        statusMessage,
      }),
    responseTimeMs,
  );
}

export function isValidEmail(email: string): boolean {
  return !!email && /.+\@.+\..+/.test(email);
}

// server-side password validation function
export function passwordStrongEnough(pw: string): {
  valid: boolean;
  reason: string;
} {
  if (!pw)
    return {
      valid: false,
      reason: "No password was provided",
    };

  // min length
  if (pw.length < 6)
    return {
      valid: false,
      reason: "Password must contain at least 6 characters",
    };

  // everything except ordinary letters
  if (!/[^a-zA-Z]/.test(pw)) {
    return {
      valid: false,
      reason: "Password must contain at least one number or symbol",
    };
  }

  // at least one letter
  if (!/[a-zA-Z]/.test(pw)) {
    return {
      valid: false,
      reason: "Password must contain at least one letter",
    };
  }

  return { valid: true, reason: "" };
}
