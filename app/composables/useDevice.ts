// Tailwind's "lg" breakpoint is 1024px; "mobile" here means anything below it.
const LG_BREAKPOINT = 1024;

// composables/useDevice.ts
export const useDevice = () => {
  const electronVersion = ref<string | undefined>();

  // UA is available on both server (request header) and client.
  // Electron's default UA already contains "Electron/41.0.2" — nothing to configure.
  const ua = import.meta.server
    ? (useRequestHeaders(["user-agent"])["user-agent"] ?? "")
    : navigator.userAgent;

  const isElectron = computed(
    () => /electron/i.test(ua) || (import.meta.client && !!window.electronAPI),
  );

  // true when the viewport is narrower than Tailwind's "lg" breakpoint
  const isSmallScreen = ref(true);

  if (import.meta.client) {
    const mql = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    isSmallScreen.value = !mql.matches;
    const onChange = (e: MediaQueryListEvent) => (isSmallScreen.value = !e.matches);
    mql.addEventListener("change", onChange);
    if (getCurrentScope()) onScopeDispose(() => mql.removeEventListener("change", onChange));
  }

  if (import.meta.client && window.electronAPI) {
    window.electronAPI.version((v: string) => (electronVersion.value = v));
  }

  return { isElectron, electronVersion, isSmallScreen };
};