<template>
  <ResourceAccessChecker>
    <UContainer>
      <BackButton href="/">
        Go to projects
      </BackButton>
    </UContainer>
    <UContainer v-if="project">
      <div class="text-2xl">
        {{ project.name }}
      </div>
      <div class="mt-6 grid grid-cols-7 gap-x-6">
        <ObservationListWidget
          :project="project"
          :show-create-button="true"
          :on-project-updated="() => { refreshObservations() }"
        />
        <ProjectParametersWidget
          :project="project"
          :on-project-updated="() => { refreshUser() }"
        />
      </div>
      <div class="mt-6">
        <CollaboratorWidget v-if="isOwner" :project="project" />
      </div>
      <div class="grid grid-cols-3 gap-6 mt-6" v-if="isOwner">
        <div>
          <ProjectExportWidget :project="project" />
        </div>
        <div class="col-span-2">
          <ProjectDynamicFieldWidget :project="project" />
        </div>
      </div>
    </UContainer>
  </ResourceAccessChecker>
    
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
      title: 'Access denied',
      description: 'You don\'t have access to this project',
      color: 'yellow',
      icon: 'i-heroicons-exclamation-triangle'
    });
    navigateTo('/');
  }
  const { refreshObservations } = await useObservations(project.value?.id as number);

</script>