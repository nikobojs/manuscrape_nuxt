export const useUser = async () => {
  const user = useState<CurrentUser | undefined>('user', () => undefined);
  const projects = useState<FullProject[]>('projects', () => []);
  const hasFetched = useState<boolean>('hasFetched', () => !!user.value)
  const projectAccess = useState<IProjectAccess[]>('projectAccess', () => []);

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
        projects.value = context.response._data.projectAccess.map((p: any) => p.project);
        projectAccess.value = context.response._data.projectAccess;
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

  function hasRoles(projectId: number, roles: string[]) {
    const project = projects.value.find((p) => p.id === projectId);
    if (!project) {
      throw new Error('Project is not defined');
    }

    const access = projectAccess.value.find((a) => a.project.id === projectId);
    if (!access) {
      throw new Error('Project access is not defined');
    }

    return roles.includes(access?.role);
  }

  return {
    user,
    projects,
    refreshUser,
    loading,
    hasFetched,
    hasRoles,
    projectAccess,
  };
}