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
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      }),
    ],
  });

  console.info('initialized sentry client-side plugin');
});
