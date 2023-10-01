<template>
    <UCard v-if="projects && projects.length > 0">
      <template #header>
        <div class="flex justify-between">
          <CardHeader>Projects</CardHeader>
          <div class="flex items-right gap-x-3">
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
      <UTable :columns="columns" :rows="projects">
        <template #createdAt-data="{ row }: { row: FullProject }">
          {{ prettyDate(row.createdAt) }}
        </template>
        <template #fields-data="{ row }">
          <div class="flex align-middle gap-x-2">
            <p>{{ row.fields.length }}</p>
            <UTooltip :text="fieldsTooltip(row)">
              <UIcon class="text-xl" name="i-heroicons-information-circle" />
            </UTooltip>
          </div>
        </template>
        <template #observationCount-data="{ row }">
          {{ row._count.observations }}
        </template>
        <template #actions-data="{ row }">
          <UTooltip text="Open project in same tab">
            <NuxtLink :href="`/projects/${row.id}`">
              <UIcon class="text-xl" name="i-heroicons-arrow-top-right-on-square" />
            </NuxtLink>
          </UTooltip>
        </template>
      </UTable>
    </UCard>
    <ModalProjectForm
      :open="openCreateProjectModal"
      :on-close="() => openCreateProjectModal = false"
    />
</template>

<script setup lang="ts">
  const { projects } = await useProjects();
  const openCreateProjectModal = ref(false);
  console.log([...projects.value])
  const columns = [
    {
      key: 'id',
      label: 'ID',
    },
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'createdAt',
      label: 'Created at',
    },
    {
      key: 'fields',
      label: 'Parameters',
    },
    {
      key: 'observationCount',
      label: 'Total observations',
    },
    {
      key: 'actions',
      label: 'Actions',
    },
  ];

  function fieldsTooltip(project: FullProject): string {
    return project.fields.map((p) => {
        return `${p.label} (${getFieldLabel(p.type)})`
    }).join(', ').trim();
  }
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