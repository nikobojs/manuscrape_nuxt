<template>
  <ResourceAccessChecker>
    <UContainer v-if="project">
      <div class="mt-6">
        <ObservationListWidget
          :project="project"
          :show-create-button="false"
          :default-observation-filter="ObservationFilterTypes.MY_DRAFTS"
          :on-project-updated="refreshObservations"
        />
      </div>
    </UContainer>
  </ResourceAccessChecker>
</template>


<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
  const { params } = useRoute();
  const { project } = await useProjects(params);
  const toast = useToast();

  if (!project.value) {
    toast.add({
      title: 'Access denied',
      description: 'You don\'t have access to this project',
      color: 'yellow',
      icon: 'i-heroicons-exclamation-triangle'
    });
    navigateTo('/');
  }

  const { refreshObservations } = await useObservations(project.value?.id as number);
</script>