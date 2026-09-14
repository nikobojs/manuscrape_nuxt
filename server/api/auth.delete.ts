import { getUserFromSession } from "~~/server/utils/authorize";

export default safeResponseHandler(async (event) => {
  console.log("================== LOG OUT USER BEGIN ==================");

  // Get the current user from session for logging
  const currentUser = await getUserFromSession(event);
  const user =
    event.context.user ||
    (currentUser
      ? {
          authSource: currentUser.authSource,
          email: currentUser.email,
        }
      : null);

  if (!user) {
    // Already logged out or never logged in
    return { success: true };
  }

  // Use the auto-imported clearUserSession from nuxt-auth-utils
  await clearUserSession(event);
  console.log("================== LOG OUT USER END ==================");
  event.context.user = undefined;
  return { success: true };
});
