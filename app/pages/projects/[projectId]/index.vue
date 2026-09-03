<template>
  <UContainer>
    <BackButton href="/projects"> Go to projects </BackButton>
  </UContainer>
  <UContainer v-if="project">
    <div class="text-2xl">
      {{ project.name }}
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
  </UContainer>
</template>

<script lang="ts" setup>
const { ensureLoggedIn } = await useAuth();
const { refreshUser } = await useUser();
await ensureLoggedIn();
const { params } = useRoute();
const { project, isOwner } = await useProjects(params);
const toast = useToast();

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

onMounted(() => {
  const isSSr = nuxtApp.isHydrating && nuxtApp.payload.serverRendered;
  if (!isSSr) {
    refreshObservations();
  }
});
</script>
