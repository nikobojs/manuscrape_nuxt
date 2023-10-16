import * as Sentry from '@sentry/node'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig().public;

  // If no sentry DSN set, ignore and warn in the console
  if (!config.sentryDsn) {
    console.warn('sentry DSN not set, not using automatic error reporting');
    return;
  }
  // If no sentry DSN set, ignore and warn in the console
  if (!['development', 'production'].includes(config?.sentryEnv as any)) {
    throw new Error('Sentry environment must be either development or production');
  }

  // Initialize Sentry
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.sentryEnv,
  });

  console.info('initialized sentry server-side plugin');
});
