<template>
  <UCard class="mb-4 overflow-visible col-span-5 h-full">
    <template #header>
      <div class="flex justify-between items-center">
        <CardHeader>Observations</CardHeader>
        <div class="inline-flex gap-3 -mt-2 -mb-2">
          <div class="w-56">
            <USelectMenu variant="outline" :options="observationFilterMenuItems" v-model="filterOption"
              option-attribute="label" />
          </div>
          <UButton icon="i-heroicons-pencil-square" variant="outline" @click="addObservationClick" :disabled="loading"
            v-if="showCreateButton">
            Create observation
          </UButton>
        </div>
      </div>
    </template>

    <UTable
      v-model:sort="sort"
      :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'No observations' }"
      :rows="observations"
      :columns="columns"
      v-if="props.project"
    >
      <template #id-data="{ row }">
        <NuxtLink :href="`/projects/${props.project?.id}/observations/${row.id}${isElectron ? '?electron=1' : ''}`">
          <span class="text-gray-600 pr-1 inline-block">#</span>
          <span class="font-semibold">{{ row.id }}</span>
        </NuxtLink>
      </template>
      <template #createdAt-data="{ row }">
        <span>{{ prettyDate(row.createdAt) }}</span>
      </template>
      <template #user-data="{ row }">
        <span>{{ row.user?.email || 'Deleted user' }}</span>
      </template>
      <template #isDraft-data="{ row }">
        <span>{{ row.isDraft ? 'Yes' : 'No' }}</span>
      </template>
      <template #actions-data="{ row }">
        <div class="w-full justify-end flex gap-x-3">
          <div v-if="typeof row.imageId === 'number'" @click="() => openObservationImage(row)">
            <span
              class="i-heroicons-photo text-xl -mt-1 -mb-1 cursor-pointer hover:text-slate-300 transition-colors"></span>
          </div>
          <NuxtLink :href="`/projects/${project?.id}/observations/${row.id}${isElectron ? '?electron=1' : ''}`">
            <span
              class="i-heroicons-arrow-top-right-on-square text-xl -mt-1 -mb-1 hover:text-slate-300 transition-colors"></span>
          </NuxtLink>
          <div
            @click="() => beginDeleteObservation(row)"
            v-if="observationIsDeletable(row, user, props.project)"
          >
            <span
              class="text-red-500 i-heroicons-trash text-xl -mt-1 -mb-1 cursor-pointer hover:text-slate-300 transition-colors"></span>
          </div>
        </div>
      </template>
    </UTable>

    <div class="flex w-full mt-3 -mb-7 justify-center">
      <UPagination v-if="totalPages > 1" v-model="page" :total="totalObservations" :max="8" :page-count="pageSize" />
    </div>
  </UCard>

  <!-- TODO: move these modals -->
  <ObservationImageModal v-if="selectedObservation" :open="openImageDialog" :observation="selectedObservation"
    :project="project" :on-close="() => openImageDialog = false" />

</template>

<script lang="ts" setup>

import { observationFilterMenuItems } from '~/utils/observationFilters';

const error = ref(null)
const loading = ref(false);
const openImageDialog = ref<boolean>(false);
const selectedObservation = ref<null | FullObservation>(null);
const { user, refreshUser } = await useUser();
const { isElectron } = useDevice();
const { report } = useSentry();
const toast = useToast();

const props = defineProps({
  project: requireProjectProp,
  showCreateButton: requireProp<boolean>(Boolean),
  defaultObservationFilter: Number as PropType<keyof typeof ObservationFilter>,
  onProjectUpdated: requireFunctionProp<() => void | Promise<void>>(),
});

const {
  createObservation,
  observations,
  totalPages,
  totalObservations,
  page,
  pageSize,
  sort,
  filterOption,
  observationIsDeletable,
  deleteObservation,
} = await useObservations(props.project.id, props.defaultObservationFilter);

function addObservationClick() {
  if (typeof props.project.id !== 'number') {
    throw new Error('Project is not defined');
  }
  loading.value = true;
  createObservation(props.project.id).catch(
    (err) => error.value = err?.message
  ).catch(() => loading.value = false).then((res) => {
    // dum ux hack :s
    if (res?.id && props.project.id) {
      navigateTo(`/projects/${props.project.id}/observations/${res.id}`)
    }
  });
}

const columns = [
  {
    label: 'ID',
    sortable: true,
    key: 'id',
  },
  {
    label: 'Created at',
    sortable: true,
    key: 'createdAt',
  },
  {
    label: 'Submitted by',
    sortable: true,
    key: 'user',
  },
  {
    label: 'Draft',
    sortable: false,
    key: 'isDraft',
  },
  {
    label: '',
    sortable: false,
    key: 'actions',
    class: 'text-right'
  },
];

function openObservationImage(row: any) {
  if (typeof row?.imageId !== 'number') {
    throw new Error('Image id is not a number')
  } else {
    selectedObservation.value = row;
    openImageDialog.value = true;
  }
}

async function beginDeleteObservation(row: any) {
  if (typeof row?.id !== 'number') {
    const msg = 'Observation id was not a number, when trying to delete observation';
    const err = new Error(msg);
    report('error', err);
    toast.add({
        title: 'An internal error just happened :(',
        description: 'The error was reported anonymously without including any third-parties.',
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle'
    })
  } else {
    // TODO: create nice confirm box
    const res = confirm(`Are you sure you want to delete observation #${row.id}?`);
    if (!res) {
      return;
    }

    try {
      const { msg } = await deleteObservation(props.project.id, row.id);

      toast.add({
        title: msg,
        color: 'green',
        icon: 'i-heroicons-check',
      });

      await props.onProjectUpdated();
    } catch(e) {
      report('error', e as string | Error)
      console.error('delete observation error:', e);
      const msg = getErrMsg(e);
      toast.add({
        title: 'Observation was NOT deleted',
        description: msg,
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      });
    }
  }
}
</script>