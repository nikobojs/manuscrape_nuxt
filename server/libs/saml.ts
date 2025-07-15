// lib/samlStrategy.ts
import { Strategy } from 'passport-saml';
import { useRuntimeConfig } from '#imports';
import type { Profile } from 'passport-saml';

export function getSamlStrategy() {
  const config = useRuntimeConfig();

  const samlStrategy = new Strategy({
    entryPoint: config.saml.entryPoint,
    issuer: config.saml.issuer,
    callbackUrl: config.saml.callbackUrl,
    cert: config.saml.cert,
    disableRequestAcsUrl: false,
    wantAssertionsSigned: true,
    authnRequestBinding: 'HTTP-Redirect',
    identifierFormat: null,
  }, (profile: Profile | null | undefined, done: (err: any, user?: any) => void) => {
    if (!profile) {
      return done(new Error('No profile returned from SAML provider'));
    }
    done(null, profile);
  });
  
  return samlStrategy;
}
