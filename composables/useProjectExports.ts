import { captureException } from "@sentry/vue";

// TODO: improve export error handling UX
export const useProjectExports = async (projectId: number) => {
  const projectExports = useState<FullProjectExport[]>('projectExports', () => []);
  const page = useState<number>(() => 1);
  const pageSize = 5;
  const skip = computed(() => (page.value - 1) * pageSize);
  const totalExports = useState<number>('totalProjectExports', () => 1); // should change after first fetch
  const totalPages = useState<number>('totalProjectPages', () => Math.ceil(totalExports.value / pageSize)); // should change after first fetch
  const exportsGenerating = useState<FullProjectExport[]>('totalProjectExportsGenerating', () => [])
  const storageLimit = useState<number>(() => 1);
  const storageUsage = useState<number>(() => 0);
  const toast = useToast();
  const storageIsFull = useState<boolean>(() => false);

  watch([storageLimit, storageUsage], ([newLimit, newUsage]) => {
    storageIsFull.value = newUsage >= newLimit;
  });

  if (typeof projectId !== 'number') {
    throw new Error(`Project id ${projectId} is not a number (useProjectExports)!`);
  }

  const { refresh, status } = await useFetch<ProjectExportsResponse>(
      () => `/api/projects/${projectId}/exports?
          take=${pageSize}&
          skip=${skip.value}
      `.trim().replaceAll(/\s/g,''),
      {
        method: 'GET',
        credentials: 'include',
        onResponse: async (context) => {
          if (context.response.status === 200) {
            // make sure typescript agrees on the response type
            const json: ProjectExportsResponse = context.response._data;

            // update state from response
            const exportsFinished = exportsGenerating.value.filter(
              ope => !json.projectExports.generating.map(npe => npe.id).includes(ope.id),
            );
            projectExports.value = json.projectExports.page;
            totalExports.value = json.projectExports.total;
            totalPages.value = Math.ceil(json.projectExports.total / pageSize);
            exportsGenerating.value = json.projectExports.generating;
            storageLimit.value = json.storageLimit;
            storageUsage.value = json.storageUsage;

            // send notification if new project export finished
            if (exportsFinished.length > 0) {
              // fetch updated versions of project exports that disappeared from the generating list
              const updatedFinished = await fetchByIds(exportsFinished.map(e => e.id));
              notifyOnDone(updatedFinished);
            }
          } else if (context.response.status === 401) {
            await navigateTo('/login', { replace: true });
          }
        },
        onResponseError: async (context) => {
          if (context.response.status === 401) {
            projectExports.value = [];
            await navigateTo('/login', { replace: true });
          } else {
            // TODO: save error in state and render for the client
            const data = context.response._data
            captureException(new Error('Export failure'), { data: { response: context.response }});
          }
        },
      }
    );
  
  const fetching = computed(() => status.value === 'pending');
  
  async function deleteExport(
    exportId: number
  ): Promise<void> {
    return $fetch(`/api/projects/${projectId}/exports/${exportId}`, {
      method: 'DELETE',
    }).catch(err => {
      // TODO: improve error handling
      console.error('delete export file err:', err);
      throw err;
    });
  }

  
  async function getObservationsCount(paramStr: string): Promise<number | null> {
    const url = `/api/projects/${projectId}/observations/count?${paramStr}`;
    const res = await $fetch(url, {});
    const json = res;
    if (typeof json !== 'number') {
      // TODO: capture error!
      // TODO: improve endpoint to return actual json
      console.error('Response is not a number!')
      console.log(json);
      return null;
    }
    return json;
  }

  async function notifyOnDone(projectExports: FullProjectExport[]): Promise<void> {
    for (const updatedProjectExport of projectExports) {
      if (updatedProjectExport?.status === 'DONE') {
        toast.add({
          title: `Export generation finished successfully`,
          color: 'green',
          icon: 'i-heroicons-check',
          actions: [{
            label: 'Download',
            click: () => {
              window.open()
              const link = document.createElement('a')
              link.href = `/api/projects/${updatedProjectExport.projectId}/exports/${updatedProjectExport.id}/download`;
              link.download = 'Download export';
              link.click();
            }
          }]
        });
      } else if (updatedProjectExport?.status === 'ERRORED') {
        toast.add({
          title: `Could not generate the export :(`,
          description: 'Please reach out on Github or Discord if this error persists.',
          color: 'red',
          icon: 'i-heroicons-exclamation-triangle',
        });
      } else {
        // TODO: report error as this should never happen
        toast.add({
          title: `Unknown change in file generation state.`,
          description: 'Please reach out on Github or Discord if this error persists.',
          color: 'red',
          icon: 'i-heroicons-exclamation-triangle',
        });
      }
    }
  }

  async function fetchById(
    exportId: number
  ): Promise<FullProjectExport | undefined> {
    return $fetch<FullProjectExport>(`/api/projects/${projectId}/exports/${exportId}`, {
      method: 'GET',
    }).catch(err => {
      // TODO: improve error handling
      console.error('fetch export file err:', err);
      throw err;
    });
  }

  async function fetchByIds(
    ids: number[]
  ): Promise<FullProjectExport[]> {
    const result: FullProjectExport[] = [];
    for (const id of ids) {
      const response = await fetchById(id);
      if (response) {
        result.push(response);
      }
    }
    return result;
  }

  function getExportParams(params: ExportProjectParams): string {
    const arr: string[] = [];
    const addParam = (k: string, v: string) => arr.push(k+'='+v);
  
    addParam('startDate', getDayBegin(params.startDate).toISOString());
    addParam('endDate', getDayEnd(params.endDate).toISOString());
    addParam('type', params.exportType);
    return arr.join('&')
  }


  async function generateExport(
    params: ExportProjectParams
  ) {
    const filterStr = getExportParams(params);
    const url = `/api/projects/${projectId}/exports?${filterStr}`;
  
    fetch(url, { method: 'POST' }).then(async (res) => {
      // if res is not 201, raise whatever error was in response
      if (res.status !== 201) {
        let msg = 'An error occured when downloading export';
        try {
          const json = await res.json();
          const _msg = getErrMsg(json);
          if (_msg) {
            msg = _msg;
          }
          toast.add({
            title: 'Export generation error',
            description: msg,
            icon: 'i-heroicons-exclamation-triangle',
            color: 'red',
          });
        } catch (e) {
          toast.add({
            title: 'Export generation error',
            description: msg,
            icon: 'i-heroicons-exclamation-triangle',
            color: 'red',
          });
        }
      } else {
        toast.add({
          title: 'Export generation started...',
          description: 'It will soon be available for download.',
          icon: 'i-heroicons-information-circle',
          color: 'blue',
        });
        await refresh();
      }
    });
  }

  function getDayBegin(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0);
    d.setUTCMinutes(0);
    d.setUTCSeconds(0);
    d.setUTCMilliseconds(1);
    return d;
  }
  
  function getDayEnd(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(23);
    d.setUTCMinutes(59);
    d.setUTCSeconds(59);
    d.setUTCMilliseconds(999);
    return d;
  }

  const exportTypeOptions = [{
    value: 'NVIVO',
    shortLabel: 'Excel',
    label: 'Excel mastersheet',
    help: '.xlsx file with observations including id column for cross-referencing with file exports',
    icon: 'mdi:microsoft-excel'
  }, {
    value: 'UPLOADS',
    shortLabel: 'Uploads',
    label: 'Uploaded observation files',
    help: 'All uploaded files on observations except the primary observation image',
    icon: 'mdi:folder-file'
  }, {
    value: 'MEDIA',
    shortLabel: 'Images',
    label: 'Observation images',
    help: 'All primary images of observations',
    icon: 'mdi:folder-multiple-image'
  }];
  
  return {
    getDayBegin,
    getDayEnd,
    deleteExport,
    projectExports,
    getExportParams,
    refreshProjectExports: refresh,
    getObservationsCount,
    fetching,
    page,
    totalPages,
    pageSize,
    totalExports,
    fetchById,
    fetchByIds,
    exportsGenerating,
    generateExport,
    storageLimit,
    storageUsage,
    storageIsFull,
    exportTypeOptions,
  };
};
