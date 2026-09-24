<template>
  <UContainer v-if="project">
    <div class="mt-6">
      <ObservationListWidget
        :project="project"
        :show-create-button="false"
        :defaultObservationFilter="ObservationFilterTypes.ALL_DRAFTS"
        @on-project-updated="
          () => {
            refreshObservations();
          }
        "
      />
    </div>
  </UContainer>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

const { ensureUserFetched } = await useAuth();
await ensureUserFetched(); // this is apparently required for this page to work correctly in electron
const { params } = useRoute();
const { project } = await useProjects(params);
const toast = useToast();

watch(project, () => {
  refreshObservations();
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

const { refreshObservations } = await useObservations(
  project,
  ObservationFilterTypes.ALL_DRAFTS,
);
</script>
