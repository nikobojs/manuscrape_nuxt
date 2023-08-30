<template>
  <UTable :rows="props.observations" :columns="columns" >
    <template #isDraft-data="{ row }">
      <span>{{ row.isDraft ? 'Yes': 'No' }}</span>
    </template>
    <template #createdAt-data="{ row }">
      <span>{{ prettyDate(row.createdAt) }}</span>
    </template>
    <template #user-data="{ row }">
      <span>{{ row.user.email }}</span>
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
  <ObservationImageDialog
    v-if="selectedObservation"
    :open="openImageDialog"
    :observation="selectedObservation"
    :project="project"
    :on-close="() => openImageDialog = false"
  />
</template>

<script lang="ts" setup>
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

  const openImageDialog = ref<boolean>(false);
  const selectedObservation = ref<null | FullObservation>(null);

  const props = defineProps({
    observations: Object as PropType<FullObservation[]>,
    project: Object as PropType<FullProject>,
  });

  function openObservationImage(row: any) {
    if (typeof row?.imageId !== 'number') {
      throw new Error('Image id is not a number')
    } else {
      selectedObservation.value = row;
      openImageDialog.value = true;
    }
  }
</script>