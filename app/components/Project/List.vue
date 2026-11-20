<template>
  <UCard v-if="projects && projects.length > 0">
    <template #header>
      <div class="flex justify-between">
        <CardHeader>Projects</CardHeader>
        <div class="flex items-right gap-x-6">
          <USelect
            color="info"
            class="cursor-pointer hover:bg-gray-800 transition-colors"
            :items="projects.map((p) => ({ label: p.name, value: p.id }))"
            placeholder="Open project..."
            @update:model-value="
              (id: string | number) => {
                navigateTo(`/projects/${id}`);
              }
            "
          />
          <UButton
            class="transition-colors whitespace-nowrap"
            icon="i-heroicons-plus"
            color="info"
            @click="() => (openCreateProjectModal = true)"
          >
            Create project
          </UButton>
        </div>
      </div>
    </template>
    <UTable
      :columns="columns"
      :data="projects"
      :sorting="[{ id: 'createdAt', desc: true }]"
    >
      <template #createdAt-cell="{ row }">
        {{ prettyDate(row.original.createdAt) }}
      </template>
      <template #name-cell="{ row }">
        <ULink
          :to="`/projects/${row.original.id}${isElectron ? '?electron=1' : ''}`"
          class="hover:underline py-2 px-2 -ml-2"
        >
          {{ row.original.name }}
        </ULink>
      </template>
      <template #fields-cell="{ row }">
        <div class="flex align-middle gap-x-2">
          <p>{{ row.original.fields.length }}</p>
          <UTooltip>
            <template #content>
              <p
                class="max-w-xs break-words whitespace-normal"
                v-for="txt in fieldsTooltips(row.original)"
              >
                {{ txt }}
              </p>
            </template>
            <UIcon class="text-xl" name="i-heroicons-information-circle" />
          </UTooltip>
        </div>
      </template>
      <template #observationCount-cell="{ row }">
        {{ row.original.observationCount }}
      </template>
      <template #actions-cell="{ row }">
        <div class="flex gap-x-3">
          <UTooltip text="Open project in same tab">
            <NuxtLink
              :href="`/projects/${row.original.id}${isElectron ? '?electron=1' : ''}`"
            >
              <UIcon
                class="text-lg"
                name="i-heroicons-arrow-top-right-on-square"
              />
            </NuxtLink>
          </UTooltip>
          <UTooltip text="Duplicate project without copying observations">
            <div
              @click="beginDuplicateProject(row.original)"
              class="hover:cursor-pointer"
            >
              <UIcon class="text-lg" name="i-mdi-content-duplicate" />
            </div>
          </UTooltip>
        </div>
      </template>
    </UTable>
  </UCard>
  <ProjectFormModal
    :open="openCreateProjectModal"
    @close="() => (openCreateProjectModal = false)"
  />
  <ProjectDuplicationModal
    :open="openDuplicateProjectModal"
    @close="
      () => {
        openDuplicateProjectModal = false;
        projectClicked = undefined;
      }
    "
    :project="projectClicked"
    @project-duplicated="onProjectDuplicated"
  />
</template>

<script setup lang="ts">
import type { TableColumn } from "#ui/types";
const { params } = useRoute();
const { refreshUser } = await useUser();
const { projects } = await useProjects(params);
const { isElectron } = useDevice();
const toast = useToast();
const openCreateProjectModal = ref(false);
const openDuplicateProjectModal = ref(false);
const projectClicked = ref<FullProject | undefined>(undefined);
const columns: TableColumn<FullProject>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "createdAt",
    header: "Created at",
  },
  {
    accessorKey: "fields",
    header: "Parameters",
  },
  {
    accessorKey: "observationCount",
    header: "Total observations",
  },
  {
    accessorKey: "actions",
    header: "",
  },
];

function fieldsTooltips(project: FullProject): string[] {
  return project.fields.map((p) => {
    return `${p.index}. "${p.label}" [${getFieldLabel(p.type)}]`;
  });
}

function beginDuplicateProject(project: FullProject): void {
  projectClicked.value = project;
  openDuplicateProjectModal.value = true;
}

async function onProjectDuplicated(newProject: FullProject): Promise<void> {
  toast.add({
    title: "Project duplicated successfully",
    color: "success",
    icon: "i-heroicons-check",
  });
  openDuplicateProjectModal.value = false;
  projectClicked.value = undefined;
  await refreshUser();
}

onMounted(() => {
  if (projects.value.length === 0) {
    openCreateProjectModal.value = true;
  }
});
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
