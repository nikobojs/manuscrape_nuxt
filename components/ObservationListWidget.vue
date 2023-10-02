
<template>
  <div class="grid grid-cols-7 gap-x-6">
    <UCard class="mb-4 overflow-visible col-span-5 h-full">
      <template #header>
        <div class="flex justify-between items-center">
          <CardHeader>Observations</CardHeader>
          <div class="inline-flex gap-3 -mt-2 -mb-2">
            <div class="w-56">
              <USelectMenu
                variant="outline"
                :options="observationFilterMenuItems"
                v-model="filterOption"
                option-attribute="label"
              />
            </div>
            <UButton
              icon="i-heroicons-pencil-square"
              variant="outline"
              @click="addObservationClick"
              :disabled="loading"
              v-if="showCreateButton"
            >
              Create observation
            </UButton>
          </div>
        </div>
      </template>

      <UTable :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'No observations'}" :rows="filteredObservations" :columns="columns" v-if="props.project" >
        <template #isDraft-data="{ row }">
          <span>{{ row.isDraft ? 'Yes': 'No' }}</span>
        </template>
        <template #createdAt-data="{ row }">
          <span>{{ prettyDate(row.createdAt) }}</span>
        </template>
        <template #user-data="{ row }">
          <span>{{ row.user?.email || 'Deleted user' }}</span>
        </template>
        <template #actions-data="{ row }">
          <div class="w-full justify-end flex gap-x-3">
            <div
              v-if="typeof row.imageId === 'number'"
              @click="() => openObservationImage(row)"
            >
              <span class="i-heroicons-photo text-xl -mt-1 -mb-1 cursor-pointer hover:text-slate-300 transition-colors"></span>
            </div>
            <NuxtLink
              :href="`/projects/${project?.id}/observations/${row.id}`"
            >
              <span class="i-heroicons-arrow-top-right-on-square text-xl -mt-1 -mb-1 hover:text-slate-300 transition-colors"></span>
            </NuxtLink>
          </div>
        </template>
    </UTable>

      <div class="flex w-full mt-3 -mb-7 justify-center">
        <UPagination v-if="totalPages > 1" v-model="page" :total="totalObservations" />
      </div>
    </UCard>

    <UCard class="dark:bg-[#11151e] col-span-2 bg-[#11151e] max-h-[520px] overflow-auto h-full">
      <template #header>
        <CardHeader>Parameters</CardHeader>
      </template>

      <div class="flex flex-col -mt-6 -mb-6 -ml-6 -mr-6">
        <div v-for="field in sortedFields" class="p-3 border-b border-slate-800">
          <div class="text-sm">
            <span v-if="field.required" class="text-red-500">*</span>
            {{ field.label }}
          </div>
          <UBadge size="xs" variant="solid" color="white" class="text-xs">{{ getFieldLabel(field.type) }}</UBadge>
        </div>
      </div>
    </UCard>
    
  </div>
  <ModalObservationImage
    v-if="selectedObservation"
    :open="openImageDialog"
    :observation="selectedObservation"
    :project="project"
    :on-close="() => openImageDialog = false"
  />
</template>

<script lang="ts" setup>
import { observationFilterMenuItems } from '~/utils/observationFilters';

  const error = ref(null)
  const { ensureLoggedIn } = await useAuth();
  const { requireProjectFromParams } = await useProjects();
  await ensureLoggedIn();
  const { user } = await useUser();
  const { params } = useRoute();
  const loading = ref(false);
  const openImageDialog = ref<boolean>(false);
  const selectedObservation = ref<null | FullObservation>(null);

  const props = defineProps({
    observations: requireObservationsProp,
    project: requireProjectProp,
    showCreateButton: requireProp<boolean>(Boolean),
    defaultObservationFilter: Number as PropType<keyof typeof ObservationFilter>,
  });

  const filterOption = ref<ObservationFilterConfig>(
    ObservationFilter[props.defaultObservationFilter || ObservationFilterTypes.ALL]
  );

  const project = requireProjectFromParams(params);
  if (typeof project?.id !== 'number') {
    throw new Error('Project is not defined');
  }

  const sortedFields = computed(() => project.fields.sort((a, b) =>
    a.required && b.required ?
    a.label.localeCompare(b.label) :
    a.required ? -1 : 1
  ));


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

  async function addObservationClick () {
    if (typeof project?.id !== 'number') {
      throw new Error('Project is not defined');
    }
    loading.value = true;
    await createObservation(project.id).catch(
      (err) => error.value = err?.message
    ).catch(() =>loading.value = false).then((res) => {
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