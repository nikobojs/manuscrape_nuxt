import type { H3Event } from "h3";

export function isOpenUrl(event: H3Event): boolean {
  const openPostUrls = [
    "/api/user",
    "/api/auth",
    "/api/token_auth",
    "/api/reset-password/reset",
    "/api/reset-password/request",
  ];
  const openGetUrls = ["/user/new", "/login", "/forgot-password"];
  const openGetUrlsStartWith = [
    "/api/_nuxt",
    "/_nuxt",
    "/__nuxt",
    "/reset-password",
    "/api/reset-password",
  ];
  const isPostRequest = event.node.req.method === "POST";
  const isGetRequest = event.node.req.method === "GET";
  const isOpenUrl =
    (isGetRequest &&
      (openGetUrls.includes(event.path) ||
        !!openGetUrlsStartWith.find((startWith) =>
          event.path.startsWith(startWith),
        ))) ||
    (isPostRequest && openPostUrls.includes(event.path));
  return isOpenUrl;
}

export function parseIntParam(val: any): number {
  const valInt = parseInt(val);
  if (isNaN(valInt)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid '${val}' id`,
    });
  }

  return valInt;
}

export function getRequestBeginTime(event: H3Event): number {
  if (typeof event.context.requestBegin !== "number") {
    throw createError({
      statusCode: 500,
      statusMessage: "requestBegin time was not found in context",
    });
  } else {
    return event.context.requestBegin;
  }
}
