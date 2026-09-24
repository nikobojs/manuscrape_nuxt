/**
 * Authenticated users have no business on guest pages and are sent to
 * /projects instead.
 */
export default defineNuxtRouteMiddleware(() => {
  if (!isAuthenticated()) return;

  return navigateTo("/projects", { replace: true });
});
