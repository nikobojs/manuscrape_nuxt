import type { H3Event } from 'h3';

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("request", ((event: H3Event) => {
    event.context.requestBegin = new Date().getTime();
  }) as never);

  nitro.hooks.hook('afterResponse', (async (
    event: H3Event,
    response?: { body?: undefined }
  ) => {
    const now = new Date().getTime();
    const diff = now - event.context.requestBegin;
    const status = getResponseStatus(event)
    const statusMsg = getResponseStatusText(event)
    const headers = getResponseHeaders(event);
    const contentType = headers['content-type'] || headers['Content-Type'];
    let log = [
      `[${new Date().toISOString()}]`,
      event.req.method,
      getRequestURL(event).pathname,
      '->',
      status,
      statusMsg,
      contentType,
      `(${diff}ms)`,
    ];

    if (response?.body && !status.toString().startsWith('2')) {
      const cleanedResponse = redactResponse(response?.body);
      log.push(JSON.stringify(cleanedResponse, null, 2));
    }

    log = log.filter((l) => !!l);
    console.log(log.join(' '))
  }) as never);
});

// remove some sensitive data from logs
function redactResponse(body: any) {
  if (body && typeof body === 'object') {
    if (body?.token) {
        body.token = '<REDACTED>';
    }
    if(body?.password) {
        body.password = '<REDACTED>';
    }
  }

  return body;
}