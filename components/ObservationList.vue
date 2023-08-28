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
      <div class="w-full text-right">
        <NuxtLink
          :href="`/projects/${project?.id}/observations/${row.id}`"  
        >
          <span class="i-heroicons-arrow-top-right-on-square text-lg -mt-1 -mb-1"></span>
        </NuxtLink>
      </div>
    </template>
  </UTable>
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
  const props = defineProps({
    observations: Object as PropType<FullObservation[]>,
    project: Object as PropType<FullProject>,
  })
</script>