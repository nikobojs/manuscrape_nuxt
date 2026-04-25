<template>
  <UContainer v-if="project">
    <div class="mt-6">
      <ObservationListWidget
        :project="project"
        :show-create-button="false"
        :defaultObservationFilter="ObservationFilterTypes.ALL_DRAFTS"
        @on-project-updated="
          () => {
            queryParamsUpdate();
          }
        "
      />
    </div>
  </UContainer>
</template>

<script lang="ts" setup>
const { ensureLoggedIn } = await useAuth();
await useUser();
await ensureLoggedIn();
const { params } = useRoute();
const { project } = await useProjects(params);
const toast = useToast();

watch(project, () => {
  queryParamsUpdate();
});

if (!project.value) {
  toast.add({
    title: "Access denied",
    description: "You don't have access to this project",
    color: "yellow",
    icon: "i-heroicons-exclamation-triangle",
  });
  navigateTo("/");
}

const { refreshObservations, queryParamsUpdate } = await useObservations(
  project.value?.id as number,
  ObservationFilterTypes.ALL_DRAFTS,
);
</script>
