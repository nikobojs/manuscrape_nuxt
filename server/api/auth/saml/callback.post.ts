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

    await authorize(event, user);

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
  console.info("SAML RESPONSE PARSED:", result);
  if (!result.profile) {
    const err = new Error(
      "SAML response was parsed but provided no `profile` argument",
    );
    captureException(err);
    throw err;
  }

  // require nameID which is the main SAML2 identifier
  if (
    typeof result.profile?.eduPersonPrincipalName !== "string" ||
    !result.profile?.eduPersonPrincipalName
  ) {
    const err = new Error(
      "No profile.eduPersonPrincipalName returned from SAML response",
    );
    console.error(err, {
      result,
    });
    captureException(err);
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid SAML response",
    });
  }

  // require sessionIndex to support log out
  if (
    typeof result.profile?.schacHomeOrganization !== "string" ||
    !result.profile?.schacHomeOrganization
  ) {
    const err = new Error(
      "No profile.schacHomeOrganization returned from SAML response",
    );
    console.error(err, {
      result,
    });
    captureException(err);
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid SAML response",
    });
  }

  const samlIdentifier =
    result.profile.schacHomeOrganization +
    "-" +
    result.profile.eduPersonPrincipalName;

  return {
    schacHomeOrganization: result.profile.schacHomeOrganization,
    eduPersonPrincipalName: result.profile.eduPersonPrincipalName,
    samlIdentifier,
  };
}
