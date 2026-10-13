import { buildCsp } from "../utils/csp";

// Base CSP for every response (API, static files, HTML). For rendered HTML
// pages, the plugin in server/plugins/csp.ts replaces this header with one
// that additionally allows the inline scripts actually present in the
// document.
export default defineEventHandler((event) => {
  setHeader(event, "Content-Security-Policy", buildCsp());
  setHeader(event, "Cross-Origin-Embedder-Policy", "require-corp");
  setHeader(event, "Cross-Origin-Opener-Policy", "same-origin");
  setHeader(event, "Cross-Origin-Resource-Policy", "cross-origin");
  setHeader(event, "Access-Control-Allow-Headers", "sentry-trace, baggage");
});
