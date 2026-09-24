<template>
  <UContainer>
    <BackButton href="/projects"> Go to projects </BackButton>
  </UContainer>
  <UContainer v-if="project">
    <div class="flex items-center gap-2">
      <div class="text-2xl">
        {{ project.name }}
      </div>
      <UButton
        variant="ghost"
        color="gray"
        icon="i-mdi-information-outline"
        @click="openDescriptionModal = true"
        class="h-6 w-6"
      />
    </div>
    <div class="mt-6 grid grid-cols-7 gap-x-6">
      <ObservationListWidget
        :project="project"
        :show-create-button="true"
        @on-project-updated="
          () => {
            refreshObservations();
          }
        "
      />
      <div class="col-span-2">
        <ProjectParametersWidget
        :project="project"
        :on-project-updated="
          () => {
            refreshUser();
          }
        "
      />
      </div>
    </div>
    <div class="mt-6">
      <CollaboratorWidget v-if="isOwner" :project="project" />
    </div>
    <div
      class="grid grid-cols-1 gap-6 mt-6"
      v-if="isOwner || project.contributorsCanReadAllObservations"
    >
      <div>
        <ProjectExportWidget :project="project" />
      </div>
    </div>
    <div class="grid grid-cols-1 gap-6 mt-6" v-if="isOwner">
      <div class="col-span-1">
        <ProjectDynamicFieldWidget :project="project" />
      </div>
    </div>
    <div class="grid grid-cols-1 gap-6 mt-6" v-if="isOwner">
      <div class="col-span-1">
        <ProjectTagsWidget :project="project" />
      </div>
    </div>
    
    <ProjectDescriptionModal
      :open="openDescriptionModal"
      :project="project"
      :isOwner="!!isOwner"
      :onClose="() => openDescriptionModal = false"
      :onSave="saveDescription"
    />
  </UContainer>
</template>

<script lang="ts" setup>
import ProjectDescriptionModal from "~/components/Project/DescriptionModal.vue";

definePageMeta({ middleware: "auth" });

const { ensureUserFetched, refreshUser } = await useAuth();
await ensureUserFetched();
const { params } = useRoute();
const { project, isOwner, patchProject } = await useProjects(params);
const toast = useToast();

const openDescriptionModal = ref(false);

if (!project.value) {
  toast.add({
    title: "Access denied",
    description: "You don't have access to this project",
    color: "yellow",
    icon: "i-heroicons-exclamation-triangle",
  });
  navigateTo("/");
}
const { refreshObservations } = await useObservations(project, undefined);
const nuxtApp = useNuxtApp();
 
async function saveDescription(description: string) {
  if (!project.value?.id) return;
  
  try {
    const response = await patchProject(project.value.id, { description });
    if (response.ok) {
      toast.add({
        title: "Description updated",
        icon: "i-heroicons-check",
        color: "green",
      });
      openDescriptionModal.value = false;
    } else {
      throw new Error("Failed to update description");
    }
  } catch (error) {
    toast.add({
      title: "Failed to update description",
      description: error instanceof Error ? error.message : "Unknown error",
      color: "red",
      icon: "i-heroicons-exclamation-triangle",
    });
  }
}
 
onMounted(() => {
  const isSSr = nuxtApp.isHydrating && nuxtApp.payload.serverRendered;
  if (!isSSr) {
    refreshObservations();
  }
});
</script>
