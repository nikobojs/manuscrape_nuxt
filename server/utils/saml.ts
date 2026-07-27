import { Strategy } from "passport-saml";
import type { Profile } from "passport-saml";

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
