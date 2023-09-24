import { requireNumber } from "./helpers";
import { type RouteParams } from "vue-router";

export const useProjects = async () => {
  const { refreshUser, loading, projects } = await useUser();

  const getProjectById = (
    projectId: number | string | undefined | null | string[]
  ): FullProject | undefined => {
    projectId = requireNumber(projectId, 'projectId')

    const result = projects.value.find(p => p.id === projectId);
    return result;
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

  const addCollaborator = async (
    projectId: number,
    email: string,
  ): Promise<any> => {
    return $fetch(
      `/api/projects/${projectId}/collaborators`,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: {
            'Content-Type': 'application/json'
        }
      }
    )
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

  const requireProjectFromParams = (params: RouteParams) => {
    const p = getProjectById(params?.projectId);
    if (!p) {
      // TODO: report error
      // throw new Error('No access to project');
      navigateTo('/');
    }
    return p;
  }

  return {
    projects,
    createProject,
    loading,
    hasOwnership,
    getProjectById,
    requireProjectFromParams,
    addCollaborator,
  };
};