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
  const config = useRuntimeConfig();
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

  let profile: Profile | null | undefined;

  try {
    const result = await samlStrategy._saml.validatePostResponseAsync({
      SAMLResponse: samlResponse,
    });
    console.info("SAML RESPONSE PARSED:", result);
    if (!result.profile) {
      const err = new Error(
        "SAML response was parsed but provided no `profile` argument",
      );
      captureException(err);
      throw err;
    }
    profile = result.profile;
  } catch (err) {
    console.error("SAML validation failed:", err);
    captureException(err);
    throw createError({
      statusCode: 401,
      statusMessage: "SAML validation failed",
    });
  }

  // require nameID which is the main SAML2 identifier
  if (!profile?.nameID) {
    const err = new Error("No profile.nameID returned from SAML response");
    console.error(err, {
      profile,
    });
    captureException(err);
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid SAML response",
    });
  }

  // require sessionIndex to support log out
  if (!profile?.sessionIndex) {
    const err = new Error(
      "No profile.sessionIndex returned from SAML response",
    );
    console.error(err, {
      profile,
    });
    captureException(err);
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid SAML response",
    });
  }

  const samlNameId = profile.nameID;
  const samlOrgName =
    (profile.schacHomeOrganization as string | undefined) || null;
  const email = profile.email || null;

  let user = await db.query.users.findFirst({
    columns: {
      id: true,
      email: true,
      authSource: true,
      createdAt: true,
      samlOrganizationName: true,
    },
    where: and(
      eq(users.samlNameId, samlNameId),
      eq(users.authSource, AuthSource.SAML),
    ),
  });

  if (!user) {
    console.log(`Creating new user for SAML email: ${email}`);
    user = await createSamlUser(email, samlNameId, samlOrgName);
  }

  await authorize(event, user);

  setCookie(event, "saml_session", profile.sessionIndex, {
    httpOnly: true,
    path: "/",
    domain: config.cookieDomain,
    sameSite: "strict",
    secure: config.cookieSecure,
  });

  return sendRedirect(event, "/", 302);
});
