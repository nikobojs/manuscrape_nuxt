
<template>
  <div class="grid grid-cols-7 gap-x-6">
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

      <UTable :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'No observations' }"
        :rows="filteredObservations" :columns="columns" v-if="props.project">
        <template #isDraft-data="{ row }">
          <span>{{ row.isDraft ? 'Yes' : 'No' }}</span>
        </template>
        <template #createdAt-data="{ row }">
          <span>{{ prettyDate(row.createdAt) }}</span>
        </template>
        <template #user-data="{ row }">
          <span>{{ row.user?.email || 'Deleted user' }}</span>
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
          </div>
        </template>
      </UTable>

      <div class="flex w-full mt-3 -mb-7 justify-center">
        <UPagination v-if="totalPages > 1" v-model="page" :total="totalObservations" />
      </div>
    </UCard>

    <UCard class="dark:bg-[#11151e] col-span-2 bg-[#11151e] h-full">
      <template #header>
        <div class="h-4 flex justify-between relative">
          <CardHeader>Parameters</CardHeader>
          <UPopover>
            <UButton icon="i-mdi-dots-vertical" variant="link" color="gray" class="text-lg absolute right-0 -top-2"
              :ui="{ rounded: 'rounded-full' }" />
            <template #panel>
              <UVerticalNavigation :links="parametersMenu"></UVerticalNavigation>
            </template>
          </UPopover>
        </div>
      </template>

      <div class="flex flex-col -mt-6 -mb-6 -ml-6 -mr-6 max-h-[460px] overflow-y-auto">
        <div v-for="field in sortedFields" class="flex flex-col gap-y-1.5 p-3 border-b border-slate-800">
          <div class="flex items-center justify-between">
            <UBadge size="xs" variant="solid" color="white" class="text-xs">
              {{ getFieldLabel(field.type) }}
            </UBadge>
            <span class="text-xs text-gray-400">
              {{ prettyDate(field.createdAt) }}
            </span>
          </div>
          <div class="text-sm">
            <span v-if="field.required" class="text-red-500">*</span>
            {{ field.label }}
          </div>
        </div>
      </div>
    </UCard>

  </div>

  <!-- TODO: move these modals -->
  <ObservationImageModal v-if="selectedObservation" :open="openImageDialog" :observation="selectedObservation"
    :project="project" :on-close="() => openImageDialog = false" />

  <UModal v-bind:model-value="openParameterPickModal" v-on:close="() => openParameterPickModal = false">
    <UCard>
      <UCommandPalette v-if="projectFieldCommandPalette" placeholder="Search parameters..." nullable
        :empty-state="{ icon: 'i-mdi-magnify', label: 'hello', queryLabel: 'Unable to find parameters with that label' }"
        :groups="[{ key: 'project-parameters', commands: projectFieldCommandPalette }]"
        :fuse="{ resultLimit: 6, fuseOptions: { threshold: 0.1 } }"
        @update:model-value="(val: any) => {
          selectedParameter = val;
          openParameterPickModal = false;
          openConfirmDeleteParamModal = true;
          console.log('selected', val, '- opening confirm dialog')
        }"
      />
    </UCard>
  </UModal>

  <UModal v-bind:model-value="openConfirmDeleteParamModal" v-on:close="() => openConfirmDeleteParamModal = false">
    <UCard>
      <template #header>
        Are you sure?
      </template>
      <span>Marked for deletion:</span>
      <span class="bg-slate-950 mt-2 mb-3 ml-1 px-2 py-0.5 text-sm rounded-sm inline-block">
        {{  selectedParameter?.label }}
      </span>
      <UAlert
        color="yellow"
        variant="outline"
        icon="i-heroicons-exclamation-triangle"
        title="This action will remove data!"
        description="All observation data will have this parameter and associated data removed permanently."
      />
      <template #footer>
        <div class="flex gap-x-3">
          <UButton
            color="red"
            @click="() => handleDeleteParameter()"
          >
            I'm sure!
          </UButton>
          <UButton
            variant="outline"
            @click="() => { openConfirmDeleteParamModal = false }"
            color="gray"
          >Get me out of here!</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script lang="ts" setup>

import { Command } from '@nuxthq/ui/dist/runtime/types';
import { observationFilterMenuItems } from '~/utils/observationFilters';

const error = ref(null)
const { ensureLoggedIn } = await useAuth();
const { requireProjectFromParams, deleteParameter } = await useProjects();
await ensureLoggedIn();
const { user } = await useUser();
const { params } = useRoute();
const loading = ref(false);
const openImageDialog = ref<boolean>(false);
const openParameterPickModal = ref(false)
const openConfirmDeleteParamModal = ref(false);
const selectedParameter = ref<null | { id: number, label: string }>();
const selectedObservation = ref<null | FullObservation>(null);
const { isElectron } = useDevice();
const toast = useToast();

const props = defineProps({
  observations: requireObservationsProp,
  project: requireProjectProp,
  showCreateButton: requireProp<boolean>(Boolean),
  defaultObservationFilter: Number as PropType<keyof typeof ObservationFilter>,
});

const projectFieldCommandPalette = computed<Command[]>(
  () => (sortedFields.value || []).map((f) => ({
    label: f.label,
    id: f.id,
  })),
);

const filterOption = ref<ObservationFilterConfig>(
  ObservationFilter[props.defaultObservationFilter || ObservationFilterTypes.ALL]
);

async function handleDeleteParameter () {
  if (typeof selectedParameter.value?.id !== 'number') {
    console.warn('Parameter not selected when trying to delete parameter');
    // TODO: report
    return;
  }

  deleteParameter(
    props.project.id,
    selectedParameter.value
  ).then(async (res) => {
    if (res.status === 200) {
      toast.add({
        title: 'Parameter was successfully deleted',
        icon: 'i-heroicons-check',
        color: 'green',
      });
    } else {
      const json = await res.json();
      throw new Error(getErrMsg(json))
    }
  }).catch((err: Error) => {
    toast.add({
      title: err.message,
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
    });
  });
}

const project = requireProjectFromParams(params);
if (typeof project?.id !== 'number') {
  throw new Error('Project is not defined');
}

const sortedFields = computed(() => project.fields.sort((a, b) =>
  a.required && b.required ?
    a.label.localeCompare(b.label) :
    a.required ? -1 : 1
));

const parametersMenu = [{
  label: 'Remove parameter',
  click: () => {
    openParameterPickModal.value = true
  },
}, {
  label: 'Add parameter',
  click: () => { console.log('add!') },
}];

const {
  createObservation,
  observations,
  totalPages,
  totalObservations,
  page
} = await useObservations(project.id);

const filteredObservations = computed<FullObservation[]>(() => observations.value.filter(
  (obs) => {
    filterOption.value
    return filterOption.value.filter(obs, user as Ref<CurrentUser>);
  }
));

async function addObservationClick() {
  if (typeof project?.id !== 'number') {
    throw new Error('Project is not defined');
  }
  loading.value = true;
  await createObservation(project.id).catch(
    (err) => error.value = err?.message
  ).catch(() => loading.value = false).then((res) => {
    // dum ux hack :s
    if (res?.id && project?.id) {
      navigateTo(`/projects/${project.id}/observations/${res.id}`)
    }
  });
}

const columns = [
  {
    label: 'Created at',
    sortable: true,
    key: 'createdAt',
  },
  {
    label: 'Created by',
    sortable: true,
    key: 'user',
  },
  {
    label: 'Draft',
    sortable: true,
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
</script>