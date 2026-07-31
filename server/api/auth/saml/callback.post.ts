import { readBody, createError } from "h3";
import type { H3Event } from "h3";
import { authorizeOrCreateUserSAML } from "~~/server/utils/saml";

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

  return authorizeOrCreateUserSAML(event, samlResponse);
});
