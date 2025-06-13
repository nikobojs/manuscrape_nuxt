export const useTags = (projectId: number) => {
  const tags = useState<Tag[]>('tags', () => []);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchTags = async () => {
    loading.value = true;
    error.value = null;

    await $fetch<Tag[]>(`/api/projects/${projectId}/tags`, {
      method: 'GET',
      credentials: 'include',
      onResponse: async (context) => {
        if (context.response.status === 200) {
          tags.value = context.response._data?.tags;
        } else if (context.response.status === 401) {
          tags.value = [];
          await navigateTo('/login', { replace: true });
        }
        loading.value = false;
      },
      onResponseError: async (context) => {
        if (context.response.status === 401) {
          tags.value = [];
          await navigateTo('/login', { replace: true });
        }
        loading.value = false;
      }
    });
  };

  const createTag = async (name: string, observationId?: number) => {
    try {
      const response = await $fetch(`/api/projects/${projectId}/tags`, {
        method: 'POST',
        body: { name },
      });

      await fetchTags(); // Always refresh

      if (observationId && response?.tag?.id) {
        await attachTagToObservation(response.tag.id, observationId);
      }
    } catch (err: any) {
      error.value = err;
      throw err;
    }
  };

  const attachTagToObservation = async (tagId: number, observationId: number) => {
    try {
      await $fetch(`/api/projects/${projectId}/observations/${observationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: { connect: [{ id: tagId }] } }),
      });
    } catch (err: any) {
      error.value = err;
      throw err;
    }
  };

  const detachTagFromObservation = async (tagId: number, observationId: number) => {
    try {
      await $fetch(`/api/projects/${projectId}/observations/${observationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: { disconnect: [{ id: tagId }] } }),
      });
    } catch (err: any) {
      error.value = err;
      throw err;
    }
  };

  return {
    tags,
    loading,
    error,
    fetchTags,
    createTag,
    attachTagToObservation,
    detachTagFromObservation,
  };
};
