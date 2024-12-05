export const useDevice = () => {
  const { query } = useRoute();
  const electronVersion = ref<undefined | string>(undefined);
  const isElectron = computed(() => {
    const result = query?.electron === '1';
    return result;
  });
  if (isElectron && window?.electronAPI) {
    window.electronAPI?.version((v: string) => {
      electronVersion.value = v;
    });
  }

  return { isElectron, electronVersion };
}