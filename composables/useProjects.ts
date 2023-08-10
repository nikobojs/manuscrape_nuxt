import { Observation, ProjectField } from "@prisma/client";
import { requireNumber } from "./helpers";

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
      // navigateTo('/')
      throw new Error('Project does not exist');
    } else {
      return result;
    }
  }

  const getObservationById = (
    project: FullProject,
    observationId: number | string | string[]
  ): Observation => {
    observationId = requireNumber(observationId, 'projectId');
    const obs = project?.observations?.find?.(o => o.id == observationId);
    if (!obs) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Observation could not be found'
      })
    } else {
      return obs;
    }
  }

  const getObservationDraftById = (
    project: FullProject,
    observationDraftId: number | string | string[]
  ): Observation => {
    observationDraftId = requireNumber(observationDraftId, 'projectId');
    const obs = project?.observationDrafts?.find?.(o => o.id == observationDraftId);
    if (!obs) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Observation draft could not be found'
      })
    } else {
      return obs;
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

  const createObservationDraft = async (
    projectId: number,
  ) => {
    return $fetch(`/api/projects/${projectId}/observation_drafts`, {
      method: 'POST',
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

  return {
    projects,
    createProject,
    loading,
    hasOwnership,
    ensureHasOwnership,
    getProjectById,
    getObservationById,
    getObservationDraftById,
    createObservationDraft,
  };
};