import { Observation } from "@prisma/client";
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
      console.error('create project err:', err);
      throw err;
    }).then(async (response) => {
      await refreshUser();
      return response;
    })
  };

  const createObservation = async (
    projectId: number,
  ) => {
    return $fetch(`/api/projects/${projectId}/observations`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.error('create observation err:', err);
      throw err;
    }).then(async (response) => {
      await refreshUser();
      return response;
    })
  };

  const patchObservation = async (
    projectId: number,
    observationId: number,
    data: any,
  ) => {
    return $fetch(`/api/projects/${projectId}/observations/${observationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: {
          'Content-Type': 'application/json'
      }
    }).catch(err => {
      console.error('create observation err:', err);
      throw err;
    }).then(async (response) => {
      await refreshUser();
      return response;
    })
  }

  const upsertObservationImage = async (
    projectId: number,
    observationId: number,
    file: File,
  ) => {
    const form = new FormData();
    form.append('file', file);

    try {
      const uploadRes = await useAsyncData('file', () =>
        $fetch(`/api/projects/${projectId}/observations/${observationId}/image`, {
          method: 'PUT',
          body: form,
        }),
      );

      console.log('UPLOAD IMAGE RESPONSE WAS:', uploadRes)

      const userRes = await refreshUser();
      return userRes;

    } catch(err: any) {
      console.error('upload image to observation err:', err);
      throw err;
    }
  }


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
    createObservation,
    loading,
    hasOwnership,
    ensureHasOwnership,
    getProjectById,
    getObservationById,
    patchObservation,
    upsertObservationImage,
  };
};