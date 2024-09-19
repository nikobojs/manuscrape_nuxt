<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center h-4">
        <CardHeader>Exports</CardHeader>
        <div class="flex items-center justify-end w-full max-w-[326px]">
          <div class="px-3 w-full">
            <ProjectStorageMeter :limit="storageLimit" :used="storageUsage" />
          </div>
          <div class="inline-flex gap-3 -mt-2 -mb-2">
            <UButton :disabled="loading || storageIsFull" icon="i-mdi-plus" variant="outline" @click="() => openNewExportModal = true">
              Create
            </UButton>
          </div>
        </div>
      </div>
    </template>
    <div
      v-if="projectExports?.length > 0"
    >
      <UTable
        :loading="loading"
        :rows="projectExports"
        :columns="columns"
      >
        <template #createdAt-data="{ row }">
          <Spinner v-if="row.status === 'GENERATING'" />
          <span v-if="row.status !== 'GENERATING'">
            {{ prettyDate(row.createdAt) }}
          </span>
        </template>
        <template #startDate-data="{ row }">
          {{ prettyDate(row.startDate) }}
        </template>
        <template #endDate-data="{ row }">
          {{ prettyDate(row.endDate) }}
        </template>
        <template #size-data="{ row }">
          <span v-if="row.status !== 'GENERATING'">
            {{ formatKb(row.size) }}
          </span>
        </template>
        <template #actions-data="{ row }">
          <div class="flex items-center justify-end relative gap-x-3">
            <NuxtLink
              v-if="row.status === 'DONE'"
              class="opacity-100 mt-[2px] -mb-[2px]"
              target="_blank"
              :to="`/api/projects/${project.id}/exports/${row.id}/download`"
            >
              <UIcon name="i-mdi-arrow-collapse-down" class="cursor-pointer text-lg" />
            </NuxtLink>
            <Spinner class="w-[18px] !m-0" v-else-if="row.status === 'GENERATING'" />
            <div
              @click="() => handleDeleteExport(row)"
            >
              <UIcon
                name="i-heroicons-trash"
                class="text-red-500 i-heroicons-trash text-xl -mt-1 -mb-1 cursor-pointer hover:text-slate-300 transition-colors"
              />
            </div>
          </div>
        </template>
        <template #user-data="{ row }">
          <div class="">
            {{  row.user?.email || '<REMOVED>' }}
          </div>
        </template>
      </UTable>
      <div class="flex w-full mt-3 mb-3 justify-center">
        <UPagination v-if="totalPages > 1" v-model="page" :total="totalExports" :max="8" :page-count="pageSize" />
      </div>
    </div>
    <div
      class="text-sm italic text-gray-400 mb-6"
      v-else-if="!loading"
    >
      No exports
    </div>
    <ProjectExportModal
      :project="project"
      :open="openNewExportModal"
      :on-close="() => openNewExportModal = false"
    />
  </UCard>
</template>

<script setup lang="ts">

const openNewExportModal = ref(false);
const props = defineProps({
  project: requireProjectProp,
});

const columns = [{
  label: 'Created at',
  key: 'createdAt',
}, {
  label: 'Type',
  key: 'type',
}, {
  label: 'From',
  key: 'startDate',
}, {
  label: 'To',
  key: 'endDate',
}, {
  label: 'Size',
  key: 'size',
}, {
  label: 'User',
  key: 'user'
}, {
  label: '',
  key: 'actions',
}];

await useUser();

const {
  projectExports,
  refreshProjectExports,
  totalExports,
  totalPages,
  page,
  pageSize,
  deleteExport,
  fetching,
  exportsGenerating,
  storageUsage,
  storageLimit,
  storageIsFull,
} = await useProjectExports(props.project.id);

const loading = computed(() => fetching.value);

// add notification for finished exports
const generatingRefresher = ref<ReturnType<typeof setTimeout>>();
const refreshGeneratingInterval = 3000;
const refreshTimer = () => {
  if (generatingRefresher.value) clearTimeout(generatingRefresher.value);
  generatingRefresher.value = setTimeout(refreshProjectExports, refreshGeneratingInterval);
}

// if generating exports, refetch again in 2 seconds
watch(exportsGenerating, async () => {
  if (exportsGenerating.value.length > 0) {
    refreshTimer();
  }
}, { deep: true, immediate: true });

const toast = useToast();

async function handleDeleteExport(projectExport: FullProjectExport) {
  const ok = confirm('Are you sure you want to delete the file ?');
  if (ok) {
    await deleteExport(projectExport.id);
    await refreshProjectExports();
    toast.add({
      title: `The export file was successfully deleted`,
      color: 'green',
      icon: 'i-heroicons-check'
    });
  }
}

</script>
