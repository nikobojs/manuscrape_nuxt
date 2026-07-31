import { captureException } from "@sentry/node";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const samlResponse = body.SAMLResponse;
  const relayState = body.RelayState;
  const session = await useSession(event, {
    password: config.saml.sessionSecret,
  });

  const samlStrategy = getSamlStrategy();

  if (samlStrategy?._saml && samlResponse) {
    try {
      resetAuthCookie(event);
      await session.clear();
      return sendRedirect(event, relayState || "/");
    } catch (e) {
      console.error("LogoutResponse validation failed:", e);
      resetAuthCookie(event); // Clear anyway
      await session.clear();
      return sendRedirect(event, "/");
    }
  } else {
    const errMsg = "SAML Logout was called without any body was received";
    console.error(errMsg);
    captureException(errMsg);
  }

  resetAuthCookie(event);
  await session.clear();
  return sendRedirect(event, "/");
});
