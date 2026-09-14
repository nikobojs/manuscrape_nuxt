import type { H3Event } from "h3";

// NOTE: urls beginning with /api are not handled here.
export function isOpenUrl(event: H3Event): boolean {
  if (event.path.startsWith("/api")) {
    console.warn(
      "isOpenUrl was called on an /api route, they are meant to handle themselves. Returning true.",
    );
    return true;
  }
  const openGetUrls = ["/user/new", "/forgot-password"];
  const openGetUrlsStartWith = [
    "/_nuxt",
    "/__nuxt",
    "/login",
    "/user/new?",
    "/reset-password",
  ];
  const isGetRequest = event.node.req.method === "GET";
  const isOpenUrl =
    isGetRequest &&
    (openGetUrls.includes(event.path) ||
      !!openGetUrlsStartWith.find((startWith) =>
        event.path.startsWith(startWith),
      ));
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
