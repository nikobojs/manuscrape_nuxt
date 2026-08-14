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

  if (import.meta.client && window.electronAPI) {
    window.electronAPI.version((v: string) => (electronVersion.value = v));
  }

  return { isElectron, electronVersion };
};