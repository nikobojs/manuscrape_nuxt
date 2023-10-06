<template>
  <ResourceAccessChecker>
    <UContainer>
      <BackButton href="/projects">
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
        />
        <ProjectParametersWidget
          :project="project"
          :on-project-updated="updateProject"
        />
      </div>
      <div class="mt-6">
        <CollaboratorWidget v-if="isOwner" :project="project" />
      </div>
      <div class="grid grid-cols-2 gap-6 mt-6">
        <!-- Dynamic fields widget -->
        <!-- TODO: seperate into its own component -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center h-4">
              <CardHeader>Dynamic fields</CardHeader>
              <div class="inline-flex gap-3" v-if="isOwner">
                <UButton
                  icon="i-heroicons-plus"
                  variant="outline"
                  color="blue"
                  @click="() => openCreateDynamicFieldModal = true"
                >
                  Create dynamic field
                </UButton>
              </div>
            </div>
          </template>
          <p class="mb-6">
            Dynamic fields will automagically generate their value when exporting observations
          </p>
          <ProjectDynamicFieldList :project="project" />
        </UCard>
        <UCard>
          <template #header>
            <div class="flex justify-between items-center h-4">
              <CardHeader>Export</CardHeader>
              <div class="flex items-center">
               <UBadge size="xs" color="yellow">WARN: In development</UBadge>                 
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </UContainer>
    <ProjectCreateDynamicFieldModal
      v-if="project"
      :project="project"
      :open="openCreateDynamicFieldModal"
      :on-close="onCloseDynamicFieldModal"
    />
  </ResourceAccessChecker>
    
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  const { refreshUser } = await useUser();
  const { params } = useRoute();
  const { project, isOwner } = await useProjects(params);
  await ensureLoggedIn();
  const openCreateDynamicFieldModal = ref(false);
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

  const updateProject = async () => {
    await refreshUser();
  }

  async function onCloseDynamicFieldModal () {
    openCreateDynamicFieldModal.value = false;
  }
</script>