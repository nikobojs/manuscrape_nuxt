export const useUser = async () => {
  const user = useState<CurrentUser | undefined>("user", () => undefined);
  const projects = useState<FullProject[]>("projects", () => []);
  const hasFetched = useState<boolean>("hasFetched", () => !!user.value);
  const projectAccess = useState<ExtendedProjectAccess[]>(
    "projectAccess",
    () => [],
  );

  const { refresh: refreshUser, pending: loading } =
    await useFetch<CurrentUser>("/api/user", {
      method: "GET",
      server: true,
      immediate: true, // changed to true 2026-04-17
      onResponse: async (context) => {
        if (context.response.status === 200) {
          const res = context.response._data as CurrentUser;
          user.value = res;
          projects.value = res.projectAccess
            .map((p: any) => {
              // We sort the fields to avoid hydration mismatch. Apparently you need to
              // think about that before nesting prisma queries too deep
              p.project.fields = [...p.project.fields.sort(sortById)];
              return p.project;
            })
            .sort(sortById);
          projectAccess.value = res.projectAccess || [];
        } else if (context.response.status === 401) {
          resetUserState();
          await navigateTo("/login", { replace: true });
        }
      },
      onResponseError: async (context) => {
        loading.value = false;
        if (context.response.status === 401) {
          resetUserState();
          await navigateTo("/login", { replace: true });
        }
      },
    });

  function hasRoles(projectId: number, roles: string[]) {
    const project = projects.value.find((p) => p.id === projectId);
    if (!project) {
      throw new Error("Project is not defined");
    }

    const access = projectAccess.value.find((a) => a.project.id === projectId);
    if (!access) {
      throw new Error("Project access is not defined");
    }

    return roles.includes(access?.role);
  }

  function resetUserState() {
    user.value = undefined;
    projects.value = [];
  }

  return {
    user,
    projects,
    refreshUser,
    loading,
    hasFetched,
    hasRoles,
    projectAccess,
    resetUserState,
  };
};

function sortById(a: { id: number }, b: { id: number }): 1 | 0 | -1 {
  if (a.id === b.id) return 0;
  else return a.id > b.id ? 1 : -1;
}
