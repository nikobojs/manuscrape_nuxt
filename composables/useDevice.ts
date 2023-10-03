export const useDevice = () =>  {
  const { query } = useRoute();
  const isElectron = computed(() => {
    const result = query?.electron === '1';
    return result;
  });

  return { isElectron };
}