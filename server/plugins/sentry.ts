import * as Sentry from '@sentry/node'

export default defineNitroPlugin(() => {
  const { public: { sentry } } = useRuntimeConfig()

  // If no sentry DSN set, ignore and warn in the console
  if (!(sentry as any)?.dsn) {
    console.warn('sentry DSN not set, not using automatic error reporting')
    return
  }
  // If no sentry DSN set, ignore and warn in the console
  if (!['development', 'production'].includes((sentry as any)?.environment)) {
    throw new Error('Sentry environment must be either development or production');
  }

  // Initialize Sentry
  Sentry.init({
    dsn: (sentry as any).dsn,
    environment: (sentry as any).environment,
    tracesSampleRate: 1.0, // Change in production!  // TODO: find out what it means
    profilesSampleRate: 1.0 // Change in production! // TODO: find out what it means
  });
});
