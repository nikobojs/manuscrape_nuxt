export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession();

  // If user is trying to access the root path
  if (to.path === '/') {
    // Redirect based on authentication state
    if (loggedIn.value) {
      return navigateTo('/projects');
    } else {
      return navigateTo('/login');
    }
  }
});
