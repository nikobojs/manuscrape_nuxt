// Builds the CSP header value and extracts sha256 hashes of the inline
// executable scripts contained in a rendered HTML document.
//
// Inline scripts are unavoidable in Nuxt SSR output: the renderer injects
// `window.__NUXT__.config=...` as an inline <script> on every page, and
// other modules may add more. Instead of maintaining a static allowlist,
// we hash whatever inline scripts each document actually contains and
// allow exactly those.
import { createHash } from "node:crypto";

const SCRIPT_TAG_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

// <script type="..."> values that are data blocks, not executable JS.
// Everything else (no type, "module", "text/javascript", ...) executes.
const NON_EXECUTABLE_TYPES = new Set([
  "application/json",
  "application/ld+json",
  "importmap",
  "speculationrules",
]);

export function inlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>();
  for (const match of html.matchAll(SCRIPT_TAG_RE)) {
    const [, attrs, content] = match;
    // external scripts are covered by 'self'
    if (/\ssrc\s*=/i.test(attrs)) {
      continue;
    }
    const type = /\stype\s*=\s*["']?([^"'>\s]+)/i.exec(attrs)?.[1]?.toLowerCase();
    if (type && NON_EXECUTABLE_TYPES.has(type)) {
      continue;
    }
    hashes.add(`'sha256-${createHash("sha256").update(content).digest("base64")}'`);
  }
  return [...hashes];
}

export function buildCsp(scriptHashes: string[] = []): string {
  const config = useRuntimeConfig();
  const sentryDsn = config.public.sentryDsn;

  // In dev, vite's client and HMR need inline scripts and eval.
  const scriptSrc =
    process.dev
      ? `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
      : `script-src 'self' ${scriptHashes.join(" ")}`;

  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
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

  return directives.join("; ");
}
