import * as Sentry from "@sentry/node";
import type { PublicRuntimeConfig } from "nuxt/schema";
import type { NitroApp } from "nitropack/types";
import { sql } from "drizzle-orm";
import { getMailer } from "../utils/mails/mailer";

export default defineNitroPlugin(async (nitro) => {
  const config = useRuntimeConfig().public;

  // initialize sentry on server startup
  initSentry(config);

  // ensure db is connected on startup
  // TODO: make exit() work with `yarn dev` forever/pm2/etc setup
  try {
    await ensureDbConnected(nitro);
    await initMailer();
  } catch (e) {
    throw e;
  }
});

function initSentry(config: PublicRuntimeConfig): void {
  // if no sentry DSN set, ignore and warn in the console
  if (!config.sentryDsn) {
    console.warn(
      "> sentry DSN not set, not using automatic error reporting (server-side)",
    );
    return;
  }
  // if sentry DSN not recognized, raise exception
  if (!["development", "production"].includes(config?.sentryEnv as any)) {
    throw new Error(
      "Sentry environment must be either development or production",
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
      setTimeout(() => reject(new Error("Database connection timeout")), ms),
    );

  try {
    console.info("> checking database connectivity...");
    // Use Promise.race to race the query against a timeout
    const _ = await Promise.race([
      db.execute(sql`SELECT 1;`),
      timeout(5000), // 5000 ms = 5 seconds
    ]);

    console.info("> connected to db");
  } catch (e) {
    // Log detailed error information
    console.error(process.env);
    console.error(e);
    console.error(
      "Unable to connect to database... Please verify your db server and env variables",
    );

    // hack to fix logs being hiddenm
    setTimeout(() => {
      nitro.hooks.callHook("close");
      process.exit(1);
    }, 100);
  }
}

async function initMailer() {
  if (process.env.VITEST === "true") return;
  try {
    await getMailer();
  } catch (e) {
    // Log detailed error information
    console.error(e);
    Sentry.captureException(e);
  }
}
