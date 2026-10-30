import * as Sentry from '@sentry/vue'
import { useRouter } from 'nuxt/app';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public;
  const router = useRouter();

  // If no sentry DSN set, ignore and warn in the console
  if (!config?.sentryDsn) {
    console.warn('sentry DSN not set, not using automatic error reporting (client-side)')
    return
  }
  // If no sentry DSN set, ignore and warn in the console
  if (!['development', 'production'].includes(config?.sentryEnv)) {
    throw new Error('Sentry environment must be either development or production');
  }
  
  // Initialize Sentry
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.sentryEnv,
    app: nuxtApp.vueApp,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
    ],
    tracesSampleRate: 1.0,
    attachProps: true,
    beforeSend(event, hint) {
      // fetch failures with no response (safari "Load failed", chrome
      // "Failed to fetch") are client-side network issues, not app bugs.
      // tag them so they can be filtered out in sentry.
      const err: any = hint.originalException;
      const msg = String(err?.message || '');
      if (msg.includes('<no response>') || msg.includes('Load failed') || msg.includes('Failed to fetch')) {
        event.tags = { ...event.tags, clientNetworkError: 'true' };
      }
      return event;
    },
  });

  console.info('initialized sentry client-side plugin');
});
