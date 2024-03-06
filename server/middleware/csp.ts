export default defineEventHandler((event) => {
  setHeader(event, 'Content-Security-Policy', "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://bugs.codecollective.dk;")
  setHeader(event, 'Cross-Origin-Embedder-Policy', 'require-corp')
  setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin')
  setHeader(event, 'Cross-Origin-Resource-Policy', 'cross-origin')
  setHeader(event, 'Access-Control-Allow-Headers', 'sentry-trace, baggage')
});