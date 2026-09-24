/**
 * On full page loads, server/middleware/auth.ts already answers
 * unauthenticated requests with a 302 to /login before the app renders,
 * so this middleware only needs to cover client-side navigations.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  if (isAuthenticated()) return;

  return navigateTo(`/login?redirect_to=${encodeURIComponent(to.fullPath)}`, {
    replace: true,
  });
});
