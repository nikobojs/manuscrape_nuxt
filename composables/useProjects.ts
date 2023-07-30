export const useProjects = async () => {
  const { refreshUser, loading, projects } = await useUser();

  const createProject = async (name: string, fields: ProjectField[]) => {
    return $fetch('/api/project', {
      method: 'POST',
      body: JSON.stringify({ name, fields }),
      headers: {
          'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.error('login catch err:', err);
      throw err;
    }).then(async (response) => {
      await refreshUser();
      return response;
    })
  };

  return {
    projects,
    createProject,
    loading,
  };
};