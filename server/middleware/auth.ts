import { defineEventHandler, sendRedirect } from "h3"; // this is not required in any other files than this one for unknown Nuxt-related type/build problems in major version 4
import { getUserFromSession, requireUserFromSession } from "../utils/authorize";
import { isOpenUrl } from "../utils/request";
import { captureException } from "@sentry/node";

export default defineEventHandler(async (event) => {
  const apiUrl = event.path.toString().startsWith("/api");
  // api takes care of their own auth
  if (apiUrl) return;
  // If it's an open URL, allow the request to proceed
  const openUrl = isOpenUrl(event);
  if (openUrl) {
    // But still try to populate event.context.user if session exists
    const user = await getUserFromSession(event);
    if (user) {
      event.context.user = user;
    }
  } else {
    // For non-open URLs, require authentication
    try {
      const session = await requireUserFromSession(event);
      // Set user in context from session user data
      event.context.user = session.user;
      // console.log("User logged in!!!");
    } catch (e) {
      const url = "/login?redirect_to=" + event.path;
      return sendRedirect(event, url, 302);
    }
  }
});
