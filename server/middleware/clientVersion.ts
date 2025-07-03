import * as semver from 'semver';

export default defineEventHandler(async (event) => {
  const versionRequirement = useRuntimeConfig().manuscrapeClientVersionRequirement;
  const userAgent = event.context.requestUserAgent;
  if (!userAgent) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User-agent cannot be empty',
    });
  }

  const versionRegex = /\d{1,2}\.\d{1,2}\.\d{1,2}/;
  const agentRegex = /ManuScrape\/\d{1,2}\.\d{1,2}\.\d{1,2}/;
  const manuClient = agentRegex.exec(userAgent);
  if (manuClient) {
    const manuVersion = versionRegex.exec(manuClient[0]);
    if (manuVersion?.[0]) {
      const versionIsSupported = semver.satisfies(manuVersion[0], versionRequirement);
      if (!versionIsSupported) {
        throw createError({
          statusCode: 426,
          statusMessage: `Your ManuScrape client is too old.`,
        });
      }
    }
  }
});
