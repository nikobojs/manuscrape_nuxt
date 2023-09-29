import type { H3Event } from 'h3';

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("request", ((event: H3Event) => {
    event.context.requestBegin = new Date().getTime();
  }) as never);

  nitro.hooks.hook('afterResponse', (async (event: H3Event, response?: { body?: undefined }) => {
    const now = new Date().getTime();
    const diff = now - event.context.requestBegin;
    const status = getResponseStatus(event)
    const statusMsg = getResponseStatusText(event)
    let log = [
      `[${new Date().toISOString()}]`,
      event.req.method,
      getRequestURL(event).pathname,
      '->',
      status,
      statusMsg,
      `(${diff}ms)`,
    ];

    if (response && !status.toString().startsWith('2')) {
      log.push(JSON.stringify({ response }, null, 2));
    }

    log = log.filter((l) => !!l);
    console.log(log.join(' '))
  }) as never);
});