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
        :data="projectExports"
        :columns="columns"
      >
        <template #createdAt-cell="{ row }">
          <Spinner v-if="row.original.status === 'GENERATING'" />
          <span v-if="row.original.status !== 'GENERATING'">
            {{ prettyDate(row.original.createdAt) }}
          </span>
        </template>
        <template #type-cell="{ row }">
          <div class="flex items-center gap-x-2">
            <UIcon :name="getIconByExportType(row.original.type)" />
            <div>
              {{ getShortLabelByExportType(row.original.type) }}
            </div>
          </div>
        </template>
        <template #startDate-cell="{ row }">
          {{ prettyDate(row.original.startDate) }}
        </template>
        <template #endDate-cell="{ row }">
          {{ prettyDate(row.original.endDate) }}
        </template>
        <template #size-cell="{ row }">
          <span v-if="row.original.status !== 'GENERATING'">
            {{ formatKb(row.original.size) }}
          </span>
        </template>
        <template #user-cell="{ row }">
          <div class="">
            {{  row.original.user?.name || row.original.user?.email || '<REMOVED>' }}
          </div>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center justify-end relative gap-x-3">
            <NuxtLink
              v-if="row.original.status === 'DONE'"
              class="opacity-100 mt-[2px] -mb-[2px]"
              target="_blank"
              :to="`/api/projects/${project.id}/exports/${row.original.id}/download`"
            >
              <UIcon name="i-mdi-arrow-collapse-down" class="cursor-pointer text-lg" />
            </NuxtLink>
            <Spinner class="w-[18px] !m-0" v-else-if="row.original.status === 'GENERATING'" />
            <div
              @click="() => handleDeleteExport(row.original)"
            >
              <UIcon
                name="i-heroicons-trash"
                class="text-red-500 i-heroicons-trash text-xl -mt-1 -mb-1 cursor-pointer hover:text-slate-300 transition-colors"
              />
            </div>
          </div>
        </template>
      </UTable>
      <div class="flex w-full mt-3 mb-3 justify-center">
        <UPagination v-if="totalPages > 1" v-model:page="page" :total="totalExports" :max="5" :page-count="pageSize" />
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
      @close="() => openNewExportModal = false"
    />
  </UCard>
</template>

<script setup lang="ts">
import type { TableColumn } from "#ui/types";

const openNewExportModal = ref(false);
const props = defineProps({
  project: requireProjectProp,
});

const getIconByExportType = (name: string) =>
  exportTypeOptions.find(o => o.value === name)?.icon || 'mdi:file-question-outline';
const getShortLabelByExportType = (name: string) =>
  exportTypeOptions.find(o => o.value === name)?.shortLabel || 'Unknown';

const columns: TableColumn<any>[] = [{
  header: 'Created at',
  accessorKey: 'createdAt',
}, {
  header: 'Type',
  accessorKey: 'type',
}, {
  header: 'From',
  accessorKey: 'startDate',
}, {
  header: 'To',
  accessorKey: 'endDate',
}, {
  header: 'Size',
  accessorKey: 'size',
}, {
  header: 'User',
  accessorKey: 'user'
}, {
  header: '',
  accessorKey: 'actions',
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
  exportTypeOptions
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
    try {
      await deleteExport(projectExport.id);
      await refreshProjectExports();
      toast.add({
        title: `The export file was successfully deleted`,
        color: 'success',
        icon: 'i-heroicons-check'
      });
    } catch (e) {
      const msg = getErrMsg(e);
      toast.add({
        title: msg,
        color: 'error',
      });
    }
  }
}

</script>
