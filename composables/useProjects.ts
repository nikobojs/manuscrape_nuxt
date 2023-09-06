import { requireNumber } from "./helpers";
import { type RouteParams } from "vue-router";

export const useProjects = async () => {
  const { refreshUser, loading, projects } = await useUser();

  const getProjectById = (
    projectId: number | string | undefined | null | string[]
  ): FullProject => {
    projectId = requireNumber(projectId, 'projectId')
    if (!projects.value?.length) {
      throw new Error('No projects are in state');
    }
    const result = projects.value.find(p => p.id === projectId);
    if (!result) {
      throw new Error('Project does not exist');
    } else {
      return result;
    }
  }

  const createProject = async (
    name: string, fields: NewField[]
  ): Promise<FullProject> => {
    return $fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, fields }),
      headers: {
          'Content-Type': 'application/json'
      }
    }).then(async (response) => {
      await refreshUser();
      return response;
    })
  };

  const hasOwnership = (
    projectId: number | string,
    projects: FullProject[]
  ): boolean => {
    projectId = requireNumber(projectId, 'projectId')
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

  const requireProjectFromParams = (params: RouteParams) => {
    const p = getProjectById(params?.projectId)
    return p;
  }

  return {
    projects,
    createProject,
    loading,
    hasOwnership,
    ensureHasOwnership,
    getProjectById,
    requireProjectFromParams,
  };
};