import type { AsyncDataExecuteOptions } from "nuxt/dist/app/composables/asyncData";
import type { RouteParams } from "vue-router";
import { getErrMsg } from '~/utils/getErrMsg';

export const useObservations = async (
  projectId: number,
  defaultObservationFilter?: keyof typeof ObservationFilter
) => {
  const observations = useState<FullObservation[]>('observations', () => []);
  const page = useState<number>(() => 1);
  const sort = ref<{column:string; direction:'asc'|'desc'}>({column: 'createdAt',  direction: 'desc'});
  const pageSize = 6;
  const skip = computed(() => (page.value - 1) * pageSize);
  const filter = useState<'all' | 'drafts' | 'published'>(() => 'all' as 'all' | 'drafts' | 'published');
  const ownership = useState<'me' | 'everyone'>(() => 'everyone' as 'everyone' | 'me');
  const totalObservations = useState<number>('totalObservations', () => 1); // should change after first fetch
  const totalPages = computed(() => Math.ceil(totalObservations.value / pageSize));

  const filterOption = useState<ObservationFilterConfig>(
    () => {
      // lazy way to validate enum is actually set
      // NOTE: sets default observation filter if passed to useObservations()
      if (typeof defaultObservationFilter === 'number' || typeof defaultObservationFilter === 'string') {
        const obsFilter = ObservationFilter[defaultObservationFilter];
        if (obsFilter) {
          filter.value = obsFilter.filter;
          ownership.value = obsFilter.ownership;
          page.value = 1;
          return obsFilter
        };
      }

      return ObservationFilter[ObservationFilterTypes.ALL];
    }
  );

  watch([filterOption], (value) => {
    filter.value = value[0].filter;
    ownership.value = value[0].ownership;
    page.value = 1
  });

  if (typeof projectId !== 'number') {
    throw new Error(`Project id ${projectId} is not a number (useObservations)!`);
  }

  const {
    pending: loading,
    refresh: refreshObservations,
  } = await useFetch<FullObservation[]>(
    () => {
      const url = `
        /api/projects/${projectId}/observations?
          take=${pageSize}&
          skip=${skip.value}&
          orderBy=${sort.value.column}&
          orderDirection=${sort.value.direction}&
          filter=${filter.value}&
          ownership=${ownership.value}
      `.trim().replaceAll(/\s/g,'');
      return url;
    },
    {
      method: 'GET',
      immediate: true,
      server: true,
      credentials: 'include',
      onResponse: async (context) => {
        if (context.response.status === 200) {
          observations.value = context.response._data?.observations.reverse?.();
          totalObservations.value = context.response._data?.total;
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

  const getObservationById = async (
    obsId: number | string | string[] | null
  ): Promise<{
    observationLoading: globalThis.Ref<boolean>;
    refreshObservation: (opts?: AsyncDataExecuteOptions | undefined) => Promise<FullObservation | null>;
    observation: globalThis.Ref<FullObservation | null>;
  }> => {
    obsId = requireNumber(obsId, 'observationId');
    const { pending, refresh, data } = await useFetch<FullObservation>(`/api/projects/${projectId}/observations/${obsId}`, {
      immediate: true,
      credentials: 'include',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    return { observationLoading: pending, refreshObservation: refresh, observation: data }
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
    })
  };

  const deleteObservationFile = async (
    projectId: number,
    observationId: number,
    file: FileUploadResponse,
  ) => {
    return $fetch(`/api/projects/${projectId}/observations/${observationId}/upload/${file.id}`, {
      method: 'DELETE',
    }).catch(err => {
      console.error('delete observation file err:', err);
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
    return res;
  };

  const deleteObservation = async (
    projectId: number,
    obsId: number,
  ) => {
    const res = await $fetch(
      `/api/projects/${projectId}/observations/${obsId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
      }
    );
    return res;
  };

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
        const msg = getErrMsg(uploadRes);
        throw new Error(msg || 'It seems that the fileupload failed :(')
      }
    } catch(err: any) {
      console.error('upload image to observation err:', err);
      throw err;
    }
  };


  const uploadObservationFile = async (
    projectId: number,
    observationId: number,
    file: File,
  ) => {
    const form = new FormData();
    form.append('file', file);

    try {
      const uploadRes = await useAsyncData('file', () =>
        $fetch(`/api/projects/${projectId}/observations/${observationId}/upload`, {
          method: 'POST',
          body: form,
        }),
      );

      if (uploadRes.status.value !== 'success') {
        const msg = getErrMsg(uploadRes);
        throw new Error(msg || 'It seems that the fileupload failed :(')
      }
    } catch(err: any) {
      console.error('upload image to observation err:', err);
      throw err;
    }
  };


  const requireObservationFromParams = async (params: RouteParams): Promise<FullObservation> => {
    const _observationId = requireNumber(params?.observationId, 'observationId');
    const _projectId = requireNumber(params?.projectId, 'projectId');

    const { observation } = await getObservationById(_observationId);

    if (!observation.value) {
      throw new Error('Observation does not exist')
    }

    return observation.value;
  };

  function observationIsDeletable(
    obs?: Partial<FullObservation>,
    user?: CurrentUser,
    project?: Partial<FullProject>,
  ): boolean {
    // TODO: validate types of used variables instead
    if (!obs || !user || !project) {
      // report missing arguments
      console.error('missing arguments in observationIsDeletable()')
      return false;
    }

    // report missing author id
    if (!obs.user?.id) {
      console.error('missing observation user id')
      return false;
    }

    // find user role
    const role = user.projectAccess.find((a) => a.project.id === project.id)?.role;
    if (typeof role !== 'string') {
      // report invalid role
      console.error(`Project access role '${role}' is not valid`);
      return false;
    }

    // find out if user is author of observation
    const isAuthor = obs.user.id === user.id;
    const isProjectOwner = role === 'OWNER';
    const isDraft = obs.isDraft;

    // ensure observation cannot be removed if it isn't a draft and user is not owner
    if (!isDraft && !isProjectOwner) {
      return false
    }

    // ensure owner cannot delete other users' drafts
    if (isDraft && !isAuthor) {
      return false;
    }

    return true;
  }

  return {
    createObservation,
    deleteObservation,
    deleteObservationFile,
    getObservationById,
    loading,
    observations,
    page,
    patchObservation,
    publishObservation,
    requireObservationFromParams,
    totalObservations,
    totalPages,
    pageSize,
    uploadObservationFile,
    upsertObservationImage,
    sort,
    filter,
    ownership,
    filterOption,
    observationIsDeletable,
    refreshObservations,
  }
};
