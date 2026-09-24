import type { H3Event, EventHandlerRequest } from "h3";
import { getRequestBeginTime, parseIntParam } from "./request";
import { captureException } from "@sentry/node";
import { getHeader, createError, getRouterParams } from "h3";
import { getObservationById } from "./observations";
import { getFullUserById } from "./users";
import { SignJWT, jwtVerify } from "jose";

/**
 * Get user from session, falling back to JWT token in Authorization header (if enabled)
 * This allows tests to use JWT tokens while production uses cookie sessions
 */
export async function getUserFromSession(
  event: H3Event,
): Promise<TokenUserData | null> {
  const config = useRuntimeConfig();

  // first, try to get user from cookie session (nuxt-auth-utils auto-import)
  try {
    const session = await getUserSession(event);
    if (session.user) {
      return session.user as TokenUserData;
    }
  } catch (_e) {
    // session might not exist, that's fine - we'll try token auth
    // console.debug("Session check failed, trying token auth:", e);
  }

  // Fallback: Check for JWT token in Authorization header if token api enabled or testing
  if (config.vitest || config.tokenApiEnabled) {
    try {
      const authHeader = getHeader(event, "Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        if (token) {
          const tokenSecret = config.tokenSecret;
          if (!tokenSecret) {
            throw new Error("TOKEN_SECRET is not configured");
          }

          const { payload: userData } = await jwtVerify(
            token,
            new TextEncoder().encode(tokenSecret),
          );
          if (userData && userData.id) {
            return userData as unknown as TokenUserData;
          } else {
            console.error("userData looks wrong");
          }
        }
      }
    } catch (e) {
      console.error("Token verification failed, error below");
      console.error(e);
    }
  }

  return null;
}

export async function requireUserFromSession(
  event: H3Event,
): Promise<{ user: TokenUserData; loggedInAt: number }> {
  const user = await getUserFromSession(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  return {
    user: user,
    loggedInAt: Date.now(),
  };
}

/**
 * Create a JWT token for a user (used for tests only)
 */
export async function createTokenForUser(user: TokenUserData): Promise<string> {
  const config = useRuntimeConfig();
  const tokenSecret = config.tokenSecret;
  if (!tokenSecret) {
    throw new Error("TOKEN_SECRET is not configured for JWT token generation");
  }

  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    authSource: user.authSource,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("180d")
    .sign(new TextEncoder().encode(tokenSecret));
}

/**
 * Authorize a user by setting their session
 */
export async function authorize(
  event: H3Event,
  user: User,
  samlSession: SAMLSessionData["saml"] | null,
): Promise<{ success: boolean; token?: string }> {
  const config = useRuntimeConfig();

  // Convert user to session data format expected by nuxt-auth-utils
  const sessionData = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      authSource: (user as any).authSource,
    } as CurrentUser,
    // Include SAML session data if present
    ...(samlSession ? { saml: samlSession } : {}),
  };
  await setUserSession(event, sessionData);

  // generate token if token api is enabled, and return it to the user
  if (config.tokenApiEnabled) {
    let token: string | undefined;
    try {
      token = await createTokenForUser({
        id: user.id,
        email: user.email,
        name: user.name,
        authSource: (user as any).authSource,
      });
      console.debug(
        "Generated JWT token for user",
        user.id,
        "for test compatibility",
      );
    } catch (e) {
      console.error(
        "Could not generate JWT token (TOKEN_SECRET not configured):",
        e,
      );
      captureException(e);
      setResponseStatus(event, 500);
      return { success: false };
    }
    return { success: true, token };
  } else {
    return { success: true };
  }
}

/**
 * Get current user from session - wrapper around requireUserSession
 */
export async function getCurrentUser(
  event: H3Event<EventHandlerRequest>,
): Promise<User> {
  const session = await requireUserSession(event);
  return session.user as User;
}

// Backward compatibility alias for existing API endpoints
export const requireUser = getCurrentUser;

/**
 * Logout user by clearing their session
 */
export async function logoutUser(event: H3Event, user: any): Promise<any> {
  // Clear the session
  await clearUserSession(event);
  return { success: true };
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
  user: CurrentUser | User | TokenUserData,
  allowedRoles: ProjectRole[] = ["OWNER", "INVITED"],
): Promise<void> {
  // return early if user is not logged in
  if (!user) {
    const err = createError({
      statusCode: 403,
      statusMessage: "User does not exist awiduyawdiuyawdiuy",
    });
    captureException(err);
    throw err;
  }

  const params = getRouterParams(event);
  let projectIdInt: undefined | number;
  let contributorsCanReadAllObservations = false;
  let role: ProjectRole = "INVITED"; // TODO: fix this weird default

  // If user doesn't have projectAccess, we need to fetch the full user with project access
  let fullUser: CurrentUser;
  if ("projectAccess" in user && Array.isArray(user.projectAccess)) {
    fullUser = user as CurrentUser;
  } else {
    // Fetch full user with project access
    fullUser = (await getFullUserById(user.id)) as CurrentUser;
  }

  // validate params.projectId if it exists
  if (typeof params?.projectId === "string") {
    // ensure projectId is parsed to integer
    projectIdInt = parseIntParam(params.projectId);

    // validate params.projectId against projectAccess.projectId and projectAccess.role
    const projectAccess = fullUser.projectAccess.find(({ project, role }) => {
      return project.id === projectIdInt && allowedRoles.includes(role);
    });

    // throw error if user doesn't have access to project
    if (!projectAccess) {
      const err = createError({
        statusCode: 403,
        statusMessage: `You don't have access to project ${projectIdInt}`,
      });
      captureException(err, { data: { user } });
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
      fullUser.id !== observation.userId &&
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
  responseTimeMs?: number | undefined,
): Promise<Record<string, any>> {
  const config = useRuntimeConfig();
  if (typeof responseTimeMs !== "number" || isNaN(responseTimeMs)) {
    responseTimeMs = config.authResponseTime;
  }
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
  responseTimeMs?: number | undefined,
) {
  const config = useRuntimeConfig();
  if (typeof responseTimeMs !== "number" || isNaN(responseTimeMs)) {
    responseTimeMs = config.authResponseTime;
  }
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
