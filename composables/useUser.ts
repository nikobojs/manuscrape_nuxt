export const useUser = async () => {
  const user = useState<CurrentUser | undefined>('user', () => undefined);
  const projects = useState<FullProject[]>('projects', () => []);
  const hasFetched = useState('hasFetched', () => !!user.value)

  const {
    refresh: refreshUser,
    pending: loading,
  } = await useFetch<CurrentUser>('/api/user', {
    method: 'GET',
    immediate: false,
    server: true,
    
    onResponse: async (context) => {
      if (context.response.status === 200) {
        user.value = context.response._data;
        projects.value = context.response._data.projects;
      } else if (context.response.status === 401) {
        user.value = undefined;
        projects.value = [];
        await navigateTo('/login', { replace: true })
      }
    },
    onResponseError: async (context) => {
      if (context.response.status === 401) {
        user.value = undefined;
        projects.value = [];
        await navigateTo('/login', { replace: true })
      }
    }
  });

  return {
    user,
    projects,
    refreshUser,
    loading,
    hasFetched
  };
}