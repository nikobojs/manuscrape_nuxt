import { safeResponseHandler } from "../utils/safeResponseHandler";

const config = useRuntimeConfig();

export default safeResponseHandler(async (event) => {
  event.context.user = undefined;

  const expires = new Date();
  setCookie(event, 'authcookie', '', {
    sameSite: 'strict',
    httpOnly: true,
    domain: config.app.cookieDomain,
    expires,
  });

  return {}
})
