export const useTags = (projectId: number) => {
  const tags = useState<Tag[]>("tags", () => []);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchTags = async () => {
    loading.value = true;
    error.value = null;

    await $fetch<Tag[]>(`/api/projects/${projectId}/tags`, {
      method: "GET",
      credentials: "include",
      onResponse: async (context) => {
        if (context.response.status === 200) {
          tags.value = context.response._data?.tags;
        } else if (context.response.status === 401) {
          tags.value = [];
          await navigateTo("/login", { replace: true });
        }
        loading.value = false;
      },
      onResponseError: async (context) => {
        if (context.response.status === 401) {
          tags.value = [];
          await navigateTo("/login", { replace: true });
        }
        loading.value = false;
      },
    });
  };

  const createTag = async (name: string, observationId?: number) => {
    try {
      const response = await $fetch(`/api/projects/${projectId}/tags`, {
        method: "POST",
        body: { name },
      });

      if (observationId && response?.tag?.id) {
        await attachTagToObservation(response.tag.id, observationId);
      }

      await fetchTags(); // Always refresh
    } catch (err: any) {
      error.value = err;
      throw err;
    }
  };

  const deleteTag = async (tagId: number): Promise<boolean> => {
    try {
      const { usageCount } = await $fetch<{ usageCount: number }>(
        `/api/projects/${projectId}/tags/${tagId}/count-connected-observations`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (usageCount > 0) {
        const confirmed = confirm(
          `This tag is used in ${usageCount} observation(s). Do you wish to delete it anyway? This action is irriversable.`,
        );
        if (!confirmed) return false;
      }

      await $fetch(`/api/projects/${projectId}/tags/${tagId}`, {
        method: "DELETE",
        credentials: "include",
      });

      await fetchTags();
      return true;
    } catch (err: any) {
      error.value = err;
      throw err;
    }
  };

  const attachTagToObservation = async (
    tagId: number,
    observationId: number,
  ) => {
    try {
      await $fetch(`/api/projects/${projectId}/observations/${observationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: { connect: [{ id: tagId }] } }),
      });
    } catch (err: any) {
      error.value = err;
      throw err;
    }
  };

  const detachTagFromObservation = async (
    tagId: number,
    observationId: number,
  ) => {
    try {
      await $fetch(`/api/projects/${projectId}/observations/${observationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
    deleteTag,
  };
};
