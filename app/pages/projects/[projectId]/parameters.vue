<template>
  <UContainer>
    <h2 class="text-3xl mt-6">
      Project parameters
      <span class="text-gray-500">&mdash; {{ project?.name }}</span>
    </h2>
    <p class="mt-1.5 mb-6 text-gray-400">
      These parameters define the shape an observation in this project. When
      changed, the formular for creating an observation will also change.
    </p>
    <div>
      <ProjectParametersWidget
        v-if="project"
        :project="project"
        :on-project-updated="onProjectUpdated"
      />
    </div>
  </UContainer>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth", "electron"] });

const { ensureUserFetched, refreshUser } = await useAuth();
await ensureUserFetched();
const { params } = useRoute();
const { isElectron } = useDevice();
const { project } = await useProjects(params);
const toast = useToast();

if (!project.value) {
  toast.add({
    title: "Access denied",
    description: "You don't have access to this project",
    color: "warning",
    icon: "i-heroicons-exclamation-triangle",
  });
  navigateTo("/");
}

async function onProjectUpdated() {
  await refreshUser();
  if (isElectron && project.value?.id) {
    window.electronAPI?.projectUpdated?.(project.value?.id);
  }
}
</script>
