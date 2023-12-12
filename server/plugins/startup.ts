import * as Sentry from '@sentry/node'
import type { PublicRuntimeConfig } from 'nuxt/schema';
import type { NitroApp } from 'nitropack';
import { exit } from 'process';

export default defineNitroPlugin(async (nitro) => {
  const config = useRuntimeConfig().public;

  // initialize sentry on server startup
  initSentry(config);

  // ensure db is connected on startup
  // TODO: make exit() work with `yarn dev` forever/pm2/etc setup
  await ensureDbConnected(nitro);
});

function initSentry(config: PublicRuntimeConfig): void {
  // if no sentry DSN set, ignore and warn in the console
  if (!config.sentryDsn) {
    console.warn('> sentry DSN not set, not using automatic error reporting (server-side)');
    return;
  }
  // if sentry DSN not recognized, raise exception
  if (!['development', 'production'].includes(config?.sentryEnv as any)) {
    throw new Error('Sentry environment must be either development or production');
  }

  // initialize Sentry
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.sentryEnv,
  });

  console.info('> initialized sentry server-side plugin');
}

async function ensureDbConnected(nitro: NitroApp) {
    try {
        // looks weird but syntax is ok!
        await prisma.$executeRaw`SELECT 1;`;
        console.info('> connected to db')
    } catch(e: any) {
        console.error(e)
        console.error('Unable to connect to database... Please verify your postgres setup and env variables');
        nitro.hooks.callHook('close');
        exit(1);
    }
}