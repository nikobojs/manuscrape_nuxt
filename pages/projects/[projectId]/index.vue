<template>
  <ResourceAccessChecker>
    <UContainer v-if="project">
      <BackButton href="/projects">
        Go to projects
      </BackButton>
      <div class="text-2xl">
        {{ project.name }}
      </div>
      <div class="mt-6 grid grid-cols-7 gap-x-6">
        <ObservationListWidget
          :observations="observations"
          :project="project"
          :show-create-button="true"
        />
        <ProjectParametersWidget
          :project="project"
          :on-project-updated="updateProject"
        />
      </div>
      <div class="mt-6">
        <CollaboratorWidget v-if="showContributors" :project="project" />
      </div>
      <div class="grid grid-cols-2 gap-6 mt-6">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center h-4">
              <CardHeader>Dynamic fields</CardHeader>
              <div class="inline-flex gap-3">
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
  const { hasRoles, refreshUser } = await useUser();
  const { requireProjectFromParams } = await useProjects();
  await ensureLoggedIn();
  const { params } = useRoute();
  const openCreateDynamicFieldModal = ref(false);

  const updateProject = async () => {
    await refreshUser();
    project.value = requireProjectFromParams(params);
  }

  const project = ref(requireProjectFromParams(params));
  if (typeof project.value?.id !== 'number') {
    throw new Error('Project is not defined');
  }

  const { observations } = await useObservations(project.value.id);

  const showContributors = computed(() => project.value?.id && hasRoles(project.value.id, ['OWNER']));

  async function onCloseDynamicFieldModal () {
    openCreateDynamicFieldModal.value = false;
  }
</script>