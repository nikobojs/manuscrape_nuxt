import { sendRedirect, readBody, createError } from "h3";
import type { H3Event } from "h3";
import type { Profile } from "passport-saml";
import { AuthSource } from "#shared/types/auth-source";
import { and, eq } from "drizzle-orm";
import { users } from "~~/server/drizzle/schema";
import { createSamlUser } from "~~/server/utils/users";
import { captureException } from "@sentry/node";

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event);
  const samlResponse: string | undefined = body?.SAMLResponse;
  console.info("SAML CALLBACK ENDPOINT CALLED!");

  if (!samlResponse) {
    console.error("Missing SAMLResponse");
    throw createError({
      statusCode: 400,
      statusMessage: "Missing SAMLResponse",
    });
  }

  const samlStrategy = getSamlStrategy();

  if (!samlStrategy?._saml) {
    console.error("SAML strategy not initialized");
    throw createError({
      statusCode: 500,
      statusMessage: "SAML strategy not initialized",
    });
  }

  try {
    const result = await samlStrategy._saml.validatePostResponseAsync({
      SAMLResponse: samlResponse,
    });

    const parsedProfile = parseSamlProfile(result);

    let user = await db.query.users.findFirst({
      columns: {
        id: true,
        email: true,
        authSource: true,
        createdAt: true,
        samlOrganizationName: true,
      },
      where: and(
        eq(users.samlIdentifier, parsedProfile.samlIdentifier),
        eq(users.authSource, AuthSource.SAML),
      ),
    });

    if (!user) {
      console.log(
        `Creating new user for SAML identifier: ${parsedProfile.samlIdentifier}`,
      );
      user = await createSamlUser(
        null,
        parsedProfile.eduPersonPrincipalName,
        parsedProfile.samlIdentifier,
        parsedProfile.schacHomeOrganization,
      );
    }

    const samlSession = {
      sessionIndex: parsedProfile.sessionIndex,
      nameID: parsedProfile.nameID,
      inResponseTo: parsedProfile.inResponseTo, // required for logging out
      // samlIdentifier: parsedProfile.samlIdentifier, // not used at the moment
    };
    await authorize(event, user, samlSession);

    // TODO: experiment to remove, please also consider removing in logout logic
    // setCookie(event, "saml_session", profile.sessionIndex, {
    //   httpOnly: true,
    //   path: "/",
    //   domain: config.cookieDomain,
    //   sameSite: "strict",
    //   secure: config.cookieSecure,
    // });

    await new Promise((ok) => setTimeout(ok, 100));

    return sendRedirect(event, "/", 302);
  } catch (err) {
    console.error("SAML validation failed:", err);
    captureException(err);
    throw createError({
      statusCode: 401,
      statusMessage: "SAML validation failed",
    });
  }
});

// NOTE: the result type comes directly from passport-saml
function parseSamlProfile(result: {
  profile?: Profile | null | undefined;
  loggedOut?: boolean;
}) {
  console.info("PARSING SAML RESPONSE:", result);

  const throwErr = (msg: string, ...data: any[]) => {
    const err = new Error(msg);
    console.error(err, ...data);
    captureException(err, { data });
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid SAML response",
    });
  };

  if (!result.profile) {
    return throwErr(
      "SAML response was parsed but provided no `profile` argument",
    );
  }

  // require nameID which is the main SAML2 identifier
  if (
    typeof result.profile?.eduPersonPrincipalName !== "string" ||
    !result.profile?.eduPersonPrincipalName
  ) {
    return throwErr(
      "No profile.eduPersonPrincipalName returned from SAML response",
      result,
    );
  }

  // require schacHomeOrganization
  if (
    typeof result.profile?.schacHomeOrganization !== "string" ||
    !result.profile?.schacHomeOrganization
  ) {
    return throwErr(
      "No profile.schacHomeOrganization returned from SAML response",
      result,
    );
  }

  // require sessionIndex to support log out
  if (
    typeof result.profile?.sessionIndex !== "string" ||
    !result.profile?.sessionIndex
  ) {
    return throwErr(
      "No profile.sessionIndex returned from SAML response",
      result,
    );
  }

  // require inResponseTo to support log out
  if (
    typeof result.profile?.inResponseTo !== "string" ||
    !result.profile?.inResponseTo
  ) {
    return throwErr(
      "No profile.inResponseTo returned from SAML response",
      result,
    );
  }

  // require sessionIndex to support log out
  if (typeof result.profile?.nameID !== "string" || !result.profile?.nameID) {
    return throwErr("No profile.nameID returned from SAML response", result);
  }

  const parsedResult = {
    schacHomeOrganization: result.profile.schacHomeOrganization,
    eduPersonPrincipalName: result.profile.eduPersonPrincipalName,
    samlIdentifier: generateSamlIdentifier(result.profile),
    sessionIndex: result.profile.sessionIndex,
    nameID: result.profile.nameID,
    inResponseTo: result.profile.inResponseTo as string,
  };
  console.info("PARSING SAML RESPONSE:", parsedResult);
  return parsedResult;
}

function generateSamlIdentifier(profile: Profile) {
  const samlIdentifier =
    profile.schacHomeOrganization + "-" + profile.eduPersonPrincipalName;

  // TODO: hash this value
  return samlIdentifier;
}
