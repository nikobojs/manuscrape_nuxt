<template>
    <UCard v-if="projects && projects.length > 0">
      <template #header>
        <div class="flex justify-between">
          <CardHeader>Projects</CardHeader>
          <div class="flex items-right gap-x-6">
            <USelect
              color="blue"
              class="cursor-pointer hover:bg-gray-800 transition-colors"
              :options="projects"
              option-attribute="name"
              value-attribute="id"
              placeholder="Open project..."
              @update:model-value="(id: string) => { navigateTo(`/projects/${id}`) }"
            />
            <UButton
              class="transition-colors"
              icon="i-heroicons-plus"
              color="blue"
              @click="() => openCreateProjectModal = true"
            >Create project</UButton>
          </div>
        </div>
      </template>
      <UTable :columns="columns" :rows="projects" :sort="{column: 'createdAt', direction: 'desc'}">
        <template #createdAt-data="{ row }: { row: FullProject }">
          {{ prettyDate(row.createdAt) }}
        </template>
        <template #fields-data="{ row }">
          <div class="flex align-middle gap-x-2">
            <p>{{ row.fields.length }}</p>
              <UTooltip
                :text="fieldsTooltip(row)"
                :ui="{
                  base: 'invisible lg:visible px-2 py-1 text-xs font-normal block',
                }"
              >
                <template #text>
                  <p class="max-w-xs break-words whitespace-normal">
                    {{ fieldsTooltip(row) }}
                  </p>
                </template>
              <UIcon class="text-xl" name="i-heroicons-information-circle" />
            </UTooltip>
          </div>
        </template>
        <template #observationCount-data="{ row }">
          {{ row._count.observations }}
        </template>
        <template #actions-data="{ row }">
          <UTooltip text="Open project in same tab">
            <NuxtLink :href="`/projects/${row.id}${isElectron ? '?electron=1' : ''}`">
              <UIcon class="text-xl" name="i-heroicons-arrow-top-right-on-square" />
            </NuxtLink>
          </UTooltip>
        </template>
      </UTable>
    </UCard>
    <ProjectFormModal
      :open="openCreateProjectModal"
      :on-close="() => openCreateProjectModal = false"
    />
</template>

<script setup lang="ts">
  const { params } = useRoute();
  const { projects } = await useProjects(params);
  const { isElectron } = useDevice();
  const openCreateProjectModal = ref(false);
  const columns = [
    {
      key: 'id',
      label: 'ID',
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'createdAt',
      label: 'Created at',
      direction: 'desc' as ("desc" | "asc"),
      sortable: true,
    },
    {
      key: 'fields',
      label: 'Parameters',
    },
    {
      key: 'observationCount',
      label: 'Total observations',
      sortable: true,
    },
    {
      key: 'actions',
      label: 'Actions',
    },
  ];

  function fieldsTooltip(project: FullProject): string {
    return project.fields.map((p) => {
        return `"${p.label}" [${getFieldLabel(p.type)}]`
    }).join('; ').trim();
  }

  onMounted(() => {
    if (projects.value.length === 0) {
      openCreateProjectModal.value = true;
    }
  })
</script>

<style>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s ease-out;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>