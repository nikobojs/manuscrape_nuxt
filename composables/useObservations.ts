import { RouteParams } from ".nuxt/vue-router";
import { Observation } from "@prisma/client";

export const useObservations = async () => {
  const { getProjectById } = await useProjects();

  const getObservationById = (
    projectId: number,
    observationId: number | string | string[]
  ): Observation => {
    observationId = requireNumber(observationId, 'observationId');
    const project = getProjectById(projectId);
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

  const requireObservationFromParams = (params: RouteParams, projectId: number) => {
    const observationId = requireNumber(params?.observationId, 'observationId');
    const p = getObservationById(observationId, projectId);
    return p;
  }

  return {
    requireObservationFromParams,
    upsertObservationImage,
    patchObservation,
    createObservation,
    getObservationById,
  }
};

function refreshUser() {
  throw new Error("Function not implemented.");
}
