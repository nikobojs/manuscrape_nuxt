import * as Sentry from "@sentry/node";
import type { PublicRuntimeConfig } from "nuxt/schema";
import type { NitroApp } from "nitropack";

export default defineNitroPlugin(async (nitro) => {
  const config = useRuntimeConfig().public;

  // initialize sentry on server startup
  initSentry(config);

  // ensure db is connected on startup
  // TODO: make exit() work with `yarn dev` forever/pm2/etc setup
  try {
    await ensureDbConnected(nitro);
  } catch(e) {
    throw e;
  }
});

function initSentry(config: PublicRuntimeConfig): void {
  // if no sentry DSN set, ignore and warn in the console
  if (!config.sentryDsn) {
    console.warn(
      "> sentry DSN not set, not using automatic error reporting (server-side)"
    );
    return;
  }
  // if sentry DSN not recognized, raise exception
  if (!["development", "production"].includes(config?.sentryEnv as any)) {
    throw new Error(
      "Sentry environment must be either development or production"
    );
  }

  // initialize Sentry
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.sentryEnv,
  });

  console.info("> initialized sentry server-side plugin");
}

async function ensureDbConnected(nitro: NitroApp) {
  const timeout = (ms: number) =>
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), ms)
    );

  try {
    console.info("> checking database connectivity...");
    // Use Promise.race to race the query against a timeout
    const _ = await Promise.race([
      db.$executeRaw`SELECT 1;`,
      timeout(5000), // 5000 ms = 5 seconds
    ]);

    console.info("> connected to db");
  } catch {
    // Log detailed error information
    console.error(
      "Unable to connect to database... Please verify your db server and env variables"
    );

    // hack to fix logs being hiddenm
    setTimeout(() => {
      nitro.hooks.callHook("close");
      process.exit(1);
    }, 100)
  }
}

