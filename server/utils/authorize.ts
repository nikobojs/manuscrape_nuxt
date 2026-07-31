import jwt from "jsonwebtoken";
import type { H3Event, EventHandlerRequest } from "h3";
import type { CookieOptions } from "nuxt/app";
import { getRequestBeginTime, parseIntParam } from "./request";
import { captureException } from "@sentry/node";

const config = useRuntimeConfig();
type SAMLSessionData = {
  saml: { nameID: string; sessionIndex: string; inResponseTo: string };
};

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
    sameSite: "lax",
    secure: config.cookieSecure,
    path: "/",
  };

  setCookie(event, "authcookie", token, flags);
}

export function resetAuthCookie(event: H3Event<EventHandlerRequest>) {
  // return deleteCookie(event, "authcookie");
  return updateAuthCookie(event, null);
}

export async function logoutUser(
  event: H3Event<EventHandlerRequest>,
  user: {
    authSource: AuthSource.PASSWORD | AuthSource.SAML;
    email: string | null;
  },
) {
  const config = useRuntimeConfig();

  // define relayState / log out final redirect url
  const relayState = encodeURIComponent(
    config.public.baseUrl + "/login?sign_out=1",
  );

  const session = await useSession<SAMLSessionData>(event, {
    password: config.saml.sessionSecret,
  });

  const samlNameId = session.data?.saml?.nameID as string | undefined;
  const sessionIndex = session.data?.saml?.sessionIndex as string | undefined;
  const inResponseTo = session.data?.saml?.inResponseTo as string | undefined;

  // clear app server session no matter what
  await session.clear();

  console.log("Logging out the following user:", user);
  // ensure user has authSource
  if (!user.authSource) {
    const errMsg = "Unable to logout, passed user has no `auth_source`";
    console.error(errMsg, { user });
    captureException(errMsg);
    throw createError({
      statusCode: 500,
      statusMessage: errMsg,
    });
  }

  // always clear auth
  resetAuthCookie(event);
  event.context.user = null;

  if (user.authSource === "PASSWORD") {
    // if auth source is LOCAL (email/password), just delete the cookies and move on
    console.log("[LOGOUT] Resetting the auth cookie for user", user);
    return {};
  } else if (user.authSource === "SAML") {
    // if auth source is SAML, delete the cookies AND sign out of the SAML IdP
    const samlStrategy = getSamlStrategy();

    // log error if samlStrategy._saml is not defined
    if (!samlStrategy?._saml) {
      const err = new Error(
        "[SAML] Logout: User auth source is SAML but saml strategy is not initialized correctly",
      );
      console.error(err);
      captureException(err);
      throw createError({
        message: err.message,
        status: 500,
      });
    }

    if (!config.saml?.identifierFormat) {
      const err = new Error(
        "[SAML] Logout: User auth source is SAML but saml identifier format is undefined",
      );
      console.error(err);
      captureException(err);
      throw createError({
        message: err.message,
        status: 500,
      });
    }

    if (!samlNameId) {
      const err = new Error(
        "[SAML] Logout: User auth source is SAML but has no samlNameId",
      );
      console.error(err);
      captureException(err);
      throw createError({
        message: err.message,
        status: 500,
      });
    }

    if (!sessionIndex) {
      const err = new Error(
        "[SAML] Logout: User auth source is SAML but sessionIndex is nodefined",
      );
      console.error(err);
      captureException(err);
      throw createError({
        message: err.message,
        status: 500,
      });
    }

    // log out for real if using saml
    if (samlStrategy._saml && config?.saml?.identifierFormat) {
      try {
        const logoutRequestXml =
          await samlStrategy!._saml?._generateLogoutRequest({
            nameID: samlNameId,
            nameIDFormat: config?.saml?.identifierFormat,
            sessionIndex: sessionIndex,
          });

        const patchedXml = logoutRequestXml.replace(
          /<samlp:LogoutRequest([^>]*)>/,
          `<samlp:LogoutRequest$1 InResponseTo="${inResponseTo}">`,
        );

        // base64-encode WITHOUT deflation (POST binding requirement)
        const samlRequest = Buffer.from(patchedXml, "utf8").toString("base64");

        // return the request the client should do from their device
        return {
          logoutUrl: config?.saml?.logoutUrl,
          SAMLRequest: samlRequest,
          RelayState: relayState,
        };
      } catch (e) {
        console.error(
          "[SAML] Unable to get logout url from saml identity provider",
          {
            user,
          },
        );
        console.error(e);
        captureException(e);
      }
    } else {
      const errMsg =
        '[SAML] Some arguments was missing during saml logout - error is logged above this line"';
      captureException(errMsg);
      console.error(errMsg);
    }
  } else {
    const errMsg = `[LOGOUT] The AuthSource '${user.authSource}' is not recognized!`;
    captureException(errMsg);
    console.error(errMsg);
  }
}

export async function authorize(
  event: H3Event,
  user: User,
  samlSession: SAMLSessionData["saml"] | null,
): Promise<{ token: string }> {
  const expires = new Date(new Date().setDate(new Date().getDate() + 365));
  event.context.user = user;
  const token = jwt.sign({ id: user.id }, config.tokenSecret);

  updateAuthCookie(event, token, expires);

  // if logging in using saml, add samlSession data to server-side session
  if (samlSession) {
    console.log("Adding saml session data", { samlSession });
    // add data to session
    const config = useRuntimeConfig();
    const session = await useSession<SAMLSessionData>(event, {
      password: config.saml.sessionSecret,
    });
    await session.update({ saml: samlSession });
  } else {
    console.log("No saml data provided, no session created");
  }

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

  // EXPERIMENT: remove this weird block of code
  // if (!event.context.user?.email) {
  //   // TODO: why is email not kept between requests?
  //   console.warn(
  //     "refetching user as only id missing in H3Event context (FIXME)",
  //   );
  //   const user = await getFullUserById(event.context.user.id);
  //   event.context.user = user;
  // }
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
