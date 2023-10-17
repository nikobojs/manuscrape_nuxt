import * as Sentry from '@sentry/vue';

export const useSentry = () => {
  const config = useRuntimeConfig().public;
  const getLogger = (s: Sentry.SeverityLevel) => {
    const logger = s === 'warning'
      ? console.warn
      : s === 'info'
      ? console.info
      : s === 'debug'
      ? console.debug
      : s === 'log'
      ? console.log
      : console.error;

    return logger;
  }

  const report = (
    severity: Sentry.SeverityLevel,
    err: Error | string
  ) => {
    // ensure error is some kind of error object
    if (!(err instanceof Error)) {
      err = new Error(err);
    }

    // use the right logging method for the right severity
    const logger = getLogger(severity);
    logger(err.message);

    // report error to sentry
    if (config.sentryDsn) {
      try {
        Sentry.captureException(err, { level: severity });
      } catch(e) {
        console.error('Unable to report an error due to the following exception:')
        console.error(e);
      }
    }
  }

  return { report };
}