export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const sentryDsn = config.public.sentryDsn;

  // In dev, vite's client and HMR need inline scripts and eval.
  const scriptSrc = process.dev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
    : `script-src 'self'`;

  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    "worker-src 'self' blob:'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ];

  // The sentry SDK is bundled with the app, so it needs no script-src entry.
  // It reports to the ingest endpoint of the DSN origin via fetch/XHR,
  // which is governed by connect-src.
  const connectSources = ["'self'"];
  if (sentryDsn) {
    connectSources.push(new URL(sentryDsn).origin);
  }
  if (process.dev) {
    // vite HMR websocket connections.
    connectSources.push("ws:", "wss:");
  }
  directives.push(`connect-src ${connectSources.join(" ")}`);

  setHeader(event, "Content-Security-Policy", directives.join("; "));
  setHeader(event, "Cross-Origin-Embedder-Policy", "require-corp");
  setHeader(event, "Cross-Origin-Opener-Policy", "same-origin");
  setHeader(event, "Cross-Origin-Resource-Policy", "cross-origin");
  setHeader(event, "Access-Control-Allow-Headers", "sentry-trace, baggage");
});
