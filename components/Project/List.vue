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
        <template #name-data="{ row }">
          <ULink :to="`/projects/${row.id}${isElectron ? '?electron=1' : ''}`" class="hover:underline py-2 px-2 -ml-2">
            {{ row.name }}
          </ULink>
        </template>
        <template #fields-data="{ row }">
          <div class="flex align-middle gap-x-2">
            <p>{{ row.fields.length }}</p>
              <UTooltip>
                <template #text>
                  <p
                    class="max-w-xs break-words whitespace-normal"
                    v-for="txt in fieldsTooltips(row)"
                  >
                    {{ txt }}
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
          <div class="flex gap-x-3">
            <UTooltip text="Open project in same tab">
              <NuxtLink :href="`/projects/${row.id}${isElectron ? '?electron=1' : ''}`">
                <UIcon class="text-lg" name="i-heroicons-arrow-top-right-on-square" />
              </NuxtLink>
            </UTooltip>
            <UTooltip text="Duplicate project without copying observations">
              <div @click="beginDuplicateProject(row)" class="hover:cursor-pointer">
                <UIcon class="text-lg" name="i-mdi-content-duplicate" />
              </div>
            </UTooltip>
          </div>
        </template>
      </UTable>
    </UCard>
    <ProjectFormModal
      :open="openCreateProjectModal"
      :on-close="() => openCreateProjectModal = false"
    />
    <ProjectDuplicationModal
      :open="openDuplicateProjectModal"
      :on-close="() => { openDuplicateProjectModal = false; projectClicked = undefined; }"
      :project="projectClicked"
      :on-project-duplicated="onProjectDuplicated"
    />
</template>

<script setup lang="ts">
  const { params } = useRoute();
  const { refreshUser } = await useUser();
  const { projects } = await useProjects(params);
  const { isElectron } = useDevice();
  const toast = useToast();
  const openCreateProjectModal = ref(false);
  const openDuplicateProjectModal = ref(false);
  const projectClicked = ref<FullProject | undefined>(undefined);
  const columns = [
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
      label: '',
    },
  ];

  function fieldsTooltips(project: FullProject): string[] {
    return project.fields.map((p) => {
        return `${p.index}. "${p.label}" [${getFieldLabel(p.type)}]`
    });
  }

  function beginDuplicateProject(project: FullProject): void {
    projectClicked.value = project;
    openDuplicateProjectModal.value = true;
  }

  async function onProjectDuplicated(newProject: FullProject): Promise<void> {
    toast.add({
      title: 'Project duplicated successfully',
      color: 'green',
      icon: 'i-heroicons-check',
    });
    openDuplicateProjectModal.value = false;
    projectClicked.value = undefined;
    await refreshUser();
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