import { sendRedirect, readBody, createError } from "h3";
import type { H3Event } from "h3";
import type { Profile } from "passport-saml";
import { AuthSource } from "#shared/types/auth-source";
import { and, eq } from "drizzle-orm";
import { users } from "~~/server/drizzle/schema";
import { createSamlUser } from "~~/server/utils/users";

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

  let profile: Profile | null | undefined;

  try {
    const result = await samlStrategy._saml.validatePostResponseAsync({
      SAMLResponse: samlResponse,
    });
    console.info("SAML RESPONSE PARSED:", result);
    profile = result.profile;
  } catch (err) {
    console.error("SAML validation failed:", err);
    throw createError({
      statusCode: 401,
      statusMessage: "SAML validation failed",
    });
  }

  if (!profile?.nameID) {
    console.error("No profile.nameID returned from SAML response:", {
      profile,
    });
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid SAML response",
    });
  }
  const samlNameId = profile.nameID;
  if (!profile?.email) {
    console.error("Email not found in SAML profile");
    throw createError({
      statusCode: 400,
      statusMessage: "Email not found in SAML profile",
    });
  }
  const email = profile.email;

  let user = await db.query.users.findFirst({
    columns: {
      id: true,
      email: true,
      authSource: true,
      createdAt: true,
    },
    where: and(
      eq(users.samlNameId, samlNameId),
      eq(users.authSource, AuthSource.SAML),
    ),
  });

  if (!user) {
    console.log(`Creating new user for SAML email: ${email}`);
    user = await createSamlUser(email, profile?.nameId + "" || null);
  }

  await authorize(event, user);

  return sendRedirect(event, "/", 302);
});
