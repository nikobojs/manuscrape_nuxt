import jwt from "jsonwebtoken";
import type { H3Event, EventHandlerRequest } from "h3";

const config = useRuntimeConfig();

// TODO: refactor and improve readability
export default defineEventHandler(async (event) => {
  const cookieValue = getCookie(event, "authcookie");
  const headers = getHeaders(event);
  const authToken = headers.authentication || cookieValue;

  if (!authToken && !isOpenUrl(event)) {
    return onNotAuthed(event);
  } else if (typeof authToken == "string" && authToken.length > 0) {
    try {
      const decoded = jwt.verify(authToken, config.tokenSecret);
      if (typeof decoded !== "string" && decoded?.id) {
        const user = await getFullUserById(decoded.id);
        if (user) {
          event.context.user = user as CurrentUser;
        } else {
          return onNotAuthed(event, "Session is valid but user does not exist");
        }
      } else {
        return onNotAuthed(event, "Your did not provide any authorization ");
      }
    } catch (e) {
      return onNotAuthed(event, "Malformed JWT");
    }
  }
});

async function onNotAuthed(
  event: H3Event<EventHandlerRequest>,
  msg: string = "You are not logged in. Please log in and try again",
): Promise<void> {
  const isApiUrl = event.path.startsWith("/api/");

  deleteCookie(event, "authcookie");

  if (!isOpenUrl(event) && isApiUrl) {
    throw createError({
      statusCode: 401,
      statusText: msg,
    });
  } else if (!isOpenUrl(event) && !isApiUrl) {
    return sendRedirect(event, "/login", 302);
  }
}
