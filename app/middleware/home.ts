/**
 * The root page has no content of its own: authenticated users are sent
 * to /projects, everyone else to /login
 */
export default defineNuxtRouteMiddleware(() => {
  return navigateTo(isAuthenticated() ? "/projects" : "/login", {
    replace: true,
  });
});
