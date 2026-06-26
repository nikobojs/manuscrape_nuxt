export default defineEventHandler((event) => {
  event.res.setHeader("Content-Type", "application/xml");
  return getSamlStrategy().generateServiceProviderMetadata(null);
});
