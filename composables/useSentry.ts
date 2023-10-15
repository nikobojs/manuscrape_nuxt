import { captureException, type SeverityLevel } from "@sentry/vue"

export const useSentry = () => {
  const report = (severity: SeverityLevel, err: Error | string) => {

    const config = useRuntimeConfig().public;

    // ensure error is some kind of error object
    if (!(err instanceof Error)) {
      err = new Error(err);
    }

    // use console.warn for warnings, console.error for the rest
    const logger = severity === 'warning'
      ? console.warn
      : severity === 'info'
      ? console.info
      : severity === 'debug'
      ? console.debug
      : severity === 'log'
      ? console.log
      : console.error;
    logger(err.message);

    // report error to sentry
    if (config.sentry?.dsn) {
      try {
        captureException(err, { level: severity });
      } catch(e) {
        console.error('Unable to report an error due to the following exception:')
        console.error(e);
      }
    }
  }

  return { report };
}