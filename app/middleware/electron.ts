/**
 * Electron-only pages: outside the Electron app, users are redirected
 * back to the project page. If the redirect target can't be determined,
 * the failure is reported to Sentry and the user is sent to /projects.
 */
export default defineNuxtRouteMiddleware((to) => {
  const { isElectron } = useDevice();
  const { report } = useSentry();

  if (isElectron.value) return;

  try {
    const projectId = to.params.projectId;
    if (typeof projectId === "string" && projectId) {
      return navigateTo(`/projects/${projectId}`, { replace: true });
    }

    report(
      "error",
      `electron middleware: route ${to.fullPath} is electron-only but has no projectId to redirect to`,
    );
  } catch (e) {
    report("error", e as Error);
  }

  return navigateTo("/projects", { replace: true });
});
