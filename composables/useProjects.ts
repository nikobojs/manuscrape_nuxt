import { ProjectField } from "@prisma/client";

export const useProjects = async () => {
  const { refreshUser, loading, projects } = await useUser();

  const getProjectById = (
    projectId: number | string | undefined | null | string[]
  ): FullProject => {
    if (!projectId) {
      throw new Error('No projectId was provided')
    } else if (typeof projectId === 'string') {
      projectId = parseInt(projectId)
    }
    if (!projects.value?.length) {
      throw new Error('No projects are in state');
    }
    const result = projects.value.find(p => p.id === projectId);
    if (!result) {
      // navigateTo('/')
      throw new Error('Project does not exist');
    } else {
      return result;
    }
  }

  const createProject = async (
    name: string, fields: NewField[]
  ) => {
    return $fetch('/api/projects', {
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

  const hasOwnership = (
    projectId: number | string,
    projects: FullProject[]
  ): boolean => {
    if (!projectId) {
      throw new Error('No projectId was provided')
    } else if (typeof projectId === 'string') {
      projectId = parseInt(projectId)
    }
    if (!projects.length) {
      return false;
    }
    const ownedIds = projects.map(p => p.id);
    const ownsProject = !!ownedIds.find(id => id === projectId);
    return ownsProject;
  }

  const ensureHasOwnership = (
    id: string | number | undefined | null | string[],
    projects: FullProject[]
  ) => {
    if (
      typeof id === 'string' &&
      !isNaN(parseInt(id)) &&
      projects?.length
    ) {
      id = parseInt(id);
    }
    
    if (
      typeof id === 'number' &&
      projects?.length
    ) {
      if (!hasOwnership(id, projects)) {
        navigateTo('/login')
      }
    } else {
      navigateTo('/login')
    }
  }

  return {
    projects,
    createProject,
    loading,
    hasOwnership,
    ensureHasOwnership,
    getProjectById,
  };
};