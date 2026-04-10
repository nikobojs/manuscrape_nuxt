export default defineEventHandler((event) => {
  const config = useRuntimeConfig().public;
  const sentryUrl = new URL(config.sentryDsn);

  if (sentryUrl) {
    const u = new URL(sentryUrl);
    const bugReportOrigin = u.origin;
    setHeader(
      event,
      "Content-Security-Policy",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${bugReportOrigin};`,
    );
  } else {
    setHeader(
      event,
      "Content-Security-Policy",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
    );
  }
  setHeader(event, "Cross-Origin-Embedder-Policy", "require-corp");
  setHeader(event, "Cross-Origin-Opener-Policy", "same-origin");
  setHeader(event, "Cross-Origin-Resource-Policy", "cross-origin");
  setHeader(event, "Access-Control-Allow-Headers", "sentry-trace, baggage");
});
