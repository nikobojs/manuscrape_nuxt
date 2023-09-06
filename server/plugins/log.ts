import type { H3Event } from 'h3';

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("request", ((event: H3Event) => {
    event.context.requestBegin = new Date().getTime();
  }) as never);

  nitro.hooks.hook('afterResponse', ((event: H3Event) => {
    const now = new Date().getTime();
    const diff = now - event.context.requestBegin;
    console.log(
      `[${new Date().toISOString()}]`,
      event.req.method,
      getRequestURL(event).pathname,
      '->',
      event.res.statusCode,
      event.res.statusMessage || '',
      `(${diff}ms)`,
    );
  }) as never);
});