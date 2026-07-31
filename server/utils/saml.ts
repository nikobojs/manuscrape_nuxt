import { Strategy } from "passport-saml";
import type { H3Event } from "h3";
import type { Profile } from "passport-saml";
import { AuthSource } from "#shared/types/auth-source";
import { and, eq } from "drizzle-orm";
import { users } from "~~/server/drizzle/schema";
import { createSamlUser } from "~~/server/utils/users";
import { captureException } from "@sentry/node";
const crypto = require("crypto");

export function getSamlStrategy() {
  const config = useRuntimeConfig();

  const samlStrategy = new Strategy(
    {
      // WAYF IdP SingleSignOnService URL (from metadata)
      entryPoint: config.saml.entryPoint,

      // YOUR App's Entity ID (unique identifier for your SP)
      issuer: config.saml.issuer,

      // Your app's AssertionConsumerService URL (where WAYF posts responses)
      callbackUrl: config.saml.callbackUrl,

      // WAYF's X509 signing certificate (PEM format, no headers)
      cert: config.saml.cert,

      // Use configured callbackUrl instead of dynamic
      disableRequestAcsUrl: true,

      // Require signed assertions (secure)
      wantAssertionsSigned: true,

      // Matches WAYF preference
      authnRequestBinding: "HTTP-Redirect",

      // Not specifying = let IdP decide
      identifierFormat: config.saml?.identifierFormat || undefined,

      // be specific about algorithm choices
      signatureAlgorithm: "sha256",
      digestAlgorithm: "sha256",

      // experiement
      logoutCallbackUrl: "https://localhost:3001/auth/saml/logout",
      logoutUrl: config.saml.logoutUrl,
    },
    (
      profile: Profile | null | undefined,
      done: (err: any, user?: any) => void,
    ) => {
      if (!profile) {
        return done(new Error("No profile returned from SAML provider"));
      }
      done(null, profile);
    },
  );

  return samlStrategy;
}

export async function authorizeOrCreateUserSAML(
  event: H3Event,
  samlResponse: string,
) {
  const config = useRuntimeConfig();
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

    const parsedProfile = parseSamlProfile(
      result,
      config.saml.identifierSecret,
    );

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
    };
    await authorize(event, user, samlSession);

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
}

// NOTE: the result type comes directly from passport-saml
function parseSamlProfile(
  result: {
    profile?: Profile | null | undefined;
    loggedOut?: boolean;
  },
  identifierSecret: string,
) {
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
    samlIdentifier: generateSamlIdentifier(result.profile, identifierSecret),
    sessionIndex: result.profile.sessionIndex,
    nameID: result.profile.nameID,
    inResponseTo: result.profile.inResponseTo as string, // currently unused
  };
  return parsedResult;
}

function generateSamlIdentifier(profile: Profile, secret: string) {
  const samlIdentifier =
    profile.schacHomeOrganization + "-" + profile.eduPersonPrincipalName;

  const hexHash = crypto
    .createHmac("sha256", secret)
    .update(samlIdentifier)
    .digest("hex");

  console.log(
    "New saml user",
    profile.eduPersonPrincipalName,
    "new hash identifier:",
    hexHash,
  );
  return hexHash;
}
