export const useDynamicFields = async (projectId: number) => {
  const dynamicFields = useState<FullDynamicProjectField[]>('dynamicFields', () => []);

  if (typeof projectId !== 'number') {
    throw new Error(`Project id ${projectId} is not a number (useDynamicFields)!`);
  }

  const { pending: loading, refresh: refreshDynamicFields } =
    await useFetch<DynamicFieldsResponse>(
      () => `/api/projects/${projectId}/dynamic-fields`,
      {
        method: 'GET',
        immediate: true,
        server: true,
        credentials: 'include',
        onResponse: async (context) => {
          if (context.response.status === 200) {
            const json: DynamicFieldsResponse = context.response._data;
            dynamicFields.value = json.dynamicFields;
          } else if (context.response.status === 401) {
            await navigateTo('/login', { replace: true });
          }
        },
        onResponseError: async (context) => {
          if (context.response.status === 401) {
            dynamicFields.value = [];
            await navigateTo('/login', { replace: true });
          }
        },
      }
    );

  const createDynamicField = async (
    projectId: number,
    field: NewDynamicField
  ): Promise<any> => {
    return $fetch(`/api/projects/${projectId}/dynamic-fields`, {
      method: 'POST',
      body: JSON.stringify(field),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(async (response) => {
      await refreshDynamicFields();
      return response;
    });
  };

  const operators = [
    {
      label: 'Difference',
      value: 'DIFF',
    },
    {
      label: 'Sum',
      value: 'SUM',
    },
  ];

  return {
    dynamicFields,
    refreshDynamicFields,
    loading,
    createDynamicField,
    operators,
  };
};
