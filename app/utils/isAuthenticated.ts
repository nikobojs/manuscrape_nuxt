export function isAuthenticated(): boolean {
  if (import.meta.server) {
    return useUserSession().loggedIn.value;
  }
  return !!useCurrentUser().value;
}
