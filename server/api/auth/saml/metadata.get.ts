import { getSamlStrategy } from '~/server/libs/saml';

export default defineEventHandler((event) => {
  event.res.setHeader('Content-Type', 'application/xml');
  return getSamlStrategy().generateServiceProviderMetadata(null);
});
