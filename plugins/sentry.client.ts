import * as Sentry from '@sentry/vue'
import { useRouter } from 'nuxt/app';

export default defineNuxtPlugin((nuxtApp) => {
  const { public: { sentry } } = useRuntimeConfig()
  const router = useRouter();

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
    app: nuxtApp.vueApp,
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      }),
    ],
  });

  console.log('Sentry client initialized!')
});
