import * as semver from "semver";
import type { H3Event } from "h3";

// The page shown to outdated clients instead of a plain nitro error page.
const DEPRECATED_CLIENT_PATH = "/deprecated-client";

function handleDeprecatedClient(event: H3Event, versionRequirement: string) {
  // The page itself must stay reachable, otherwise we would redirect forever.
  if (event.path.startsWith(DEPRECATED_CLIENT_PATH)) {
    return;
  }

  const isApiUrl = event.path.startsWith("/api");
  const isGetRequest = event.node.req.method === "GET";
  const acceptsHtml =
    (getRequestHeader(event, "accept") || "").includes("text/html");

  if (!isApiUrl && isGetRequest) {
    // Page navigations get redirected to the download page.
    if (acceptsHtml) {
      // Show the plain version instead of the full semver range.
      const requiredVersion =
        /\d{1,2}\.\d{1,2}\.\d{1,2}/.exec(versionRequirement)?.[0] ??
        versionRequirement;
      return sendRedirect(
        event,
        `${DEPRECATED_CLIENT_PATH}?required=${encodeURIComponent(requiredVersion)}`,
        302,
      );
    }
    // Other GET requests (scripts, styles, images) pass through so the
    // deprecated-client page renders with styling.
    return;
  }

  throw createError({
    statusCode: 426,
    statusMessage: `Your ManuScrape client is too old.`,
  });
}

export default defineEventHandler(async (event) => {
  const versionRequirement =
    useRuntimeConfig().manuscrapeClientVersionRequirement;
  const userAgent = (event.context.requestUserAgent || "").trim();
  if (!userAgent) {
    throw createError({
      statusCode: 400,
      statusMessage: "User-agent cannot be empty",
    });
  }

  const versionRegex = /\d{1,2}\.\d{1,2}\.\d{1,2}/;
  const agentRegex = /ManuScrape\/\d{1,2}\.\d{1,2}\.\d{1,2}/;
  const manuClient = agentRegex.exec(userAgent);
  if (manuClient) {
    const manuVersion = versionRegex.exec(manuClient[0]);
    if (manuVersion?.[0]) {
      const versionIsSupported = semver.satisfies(
        manuVersion[0],
        versionRequirement,
      );
      if (!versionIsSupported) {
        handleDeprecatedClient(event, versionRequirement);
      }
    }
  }
});
