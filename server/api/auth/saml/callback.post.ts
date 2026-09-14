import { readBody, createError, sendRedirect } from "h3";
import type { H3Event } from "h3";

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event);
  const samlResponse: string | undefined = body?.SAMLResponse;
  console.info("SAML CALLBACK ENDPOINT CALLED!");

  if (!samlResponse) {
    console.error("Missing SAMLResponse");
    throw createError({
      statusCode: 400,
      statusMessage: "Missing SAMLResponse",
    });
  }

  await authorizeOrCreateUserSAML(event, samlResponse);
  
  // Redirect to root path after successful SAML authentication
  // The middleware will handle redirect to /projects or /login
  return sendRedirect(event, "/", 302);
});
