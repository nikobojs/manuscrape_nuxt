// Nitro renders HTML after the middleware has already set a CSP header.
// This hook runs on the finished response body (before headers are sent),
// hashes every inline executable script it contains, and replaces the
// CSP header with a policy that allows exactly those scripts.
import { buildCsp, inlineScriptHashes } from "../utils/csp";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:response", (response, ctx) => {
    if (typeof response.body !== "string") {
      return;
    }
    const hashes = inlineScriptHashes(response.body);
    if (hashes.length === 0) {
      return;
    }
    setHeader(ctx.event, "Content-Security-Policy", buildCsp(hashes));
  });
});
