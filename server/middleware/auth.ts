import jwt from "jsonwebtoken";
import type { H3Event, EventHandlerRequest } from "h3";

const config = useRuntimeConfig();

// TODO: refactor and improve readability
export default defineEventHandler(async (event) => {
  const cookieValue = getCookie(event, "authcookie");
  const headers = getHeaders(event);
  const authToken = headers.authentication || cookieValue;
  const openUrl = isOpenUrl(event);
  if (!authToken && !openUrl && !event.context?.user) {
    console.log('onNotAuth 0')
    return onNotAuthed(event);
  } else if (typeof authToken == "string" && authToken.length > 0) {
    try {
      const decoded = jwt.verify(authToken, config.tokenSecret);
      if (typeof decoded !== "string" && decoded?.id) {
        const user = await getFullUserById(decoded.id);
        if (user) {
          event.context.user = user as CurrentUser;
        } else {
          console.log('onNotAuth 1')
          return onNotAuthed(event, "Session is valid but user does not exist");
        }
      } else {
        console.log('onNotAuth 2')
        return onNotAuthed(event, "Your did not provide any authorization ");
      }
    } catch (e) {console.log('onNotAuth 3', e)
      return onNotAuthed(event, "Malformed JWT");
    }
  }
});

async function onNotAuthed(
  event: H3Event<EventHandlerRequest>,
  msg: string = "You are not logged in. Please log in and try again",
): Promise<void> {
  console.log(msg);
  const isApiUrl = event.path.startsWith("/api/");
  const openUrl = isOpenUrl(event);

  deleteCookie(event, "authcookie");

  if (!openUrl && isApiUrl) {
    throw createError({
      statusCode: 401,
      statusMessage: msg,
    });
  } else if (!openUrl && !isApiUrl) {
    return sendRedirect(event, "/login", 302);
  }
  // open url with a bad/expired token: cookie is deleted above, continue as
  // an unauthenticated request (routine case, e.g. /login with a stale cookie)
}
