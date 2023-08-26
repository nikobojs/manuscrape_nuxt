import type { RouteParams } from "vue-router";

export const useObservations = async () => {
  const observations = useState<FullObservation[]>('observations', () => []);
  const projectId = useState<number | null>('currentProjectId', () => null);
  const hasRefreshedOnce = ref(false)

  const {
    refresh: _refreshObservations,
    pending: loading,
  } = await useFetch<FullObservation[]>(
    () => `/api/projects/${projectId.value}/observations`,
    {
      method: 'GET',
      immediate: false,
      server: true,
      onResponse: async (context) => {
        if (context.response.status === 200) {
          observations.value = context.response._data?.observations;
        } else if (context.response.status === 401) {
          observations.value = [];
          await navigateTo('/login', { replace: true })
        }
      },
      onResponseError: async (context) => {
        if (context.response.status === 401) {
          observations.value = [];
          await navigateTo('/login', { replace: true })
        }
      }
    }
  );

  const refreshObservations = async (_projectId: number) => {
    projectId.value = _projectId;
    hasRefreshedOnce.value = true
    await _refreshObservations();
  }

  const getObservationById = async (
    obsId: number | string | string[] | null
  ): Promise<FullObservation> => {
    obsId = requireNumber(obsId, 'observationId');
    const obs = observations.value?.find?.(o => o.id == obsId);
    if (!obs) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Observation could not be found'
      })
    } else {
      return obs as FullObservation;
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
    })
  };

  const patchObservation = async (
    projectId: number,
    obsId: number,
    data: any,
  ) => {
    const res = await $fetch(
      `/api/projects/${projectId}/observations/${obsId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
      }
    );
    await refreshObservations(projectId);
    return res;
  }

  const publishObservation = (
    projectId: number,
    obsId: number,
  ) => patchObservation(
    projectId,
    obsId,
    { isDraft: false }
  );

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

      if (uploadRes.status.value !== 'success') {
        throw new Error('It seems that the fileupload failed :(')
      }
    } catch(err: any) {
      console.error('upload image to observation err:', err);
      throw err;
    }
  }


  const requireObservationFromParams = async (params: RouteParams): Promise<FullObservation> => {
    const _observationId = requireNumber(params?.observationId, 'observationId');
    const _projectId = requireNumber(params?.projectId, 'projectId');
    if (!hasRefreshedOnce.value || projectId.value !== _projectId) {
      await refreshObservations(_projectId);
    }

    return getObservationById(_observationId);
  }

  return {
    requireObservationFromParams,
    upsertObservationImage,
    patchObservation,
    createObservation,
    getObservationById,
    refreshObservations,
    observations,
    loading,
    publishObservation,
  }
};
