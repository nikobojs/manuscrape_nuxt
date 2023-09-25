<template>
  <ResourceAccessChecker>
    <UContainer>
      <UTabs :items="tabs" :default-index="0" v-if="project">
        <template #item="{ item }">
          <div v-if="item.key === 'observations'" class="mt-6">
            <UCard class="mb-4">
              <template #header>
                <div class="flex justify-between items-center">
                  <p>Observations</p>
                  <div class="inline-flex gap-3">
                    <UButton
                      icon="i-heroicons-pencil-square"
                      variant="outline"
                      @click="addObservationClick"
                      :disabled="loading"
                    >
                      Create observation
                    </UButton>
                    <UButton
                      icon="i-heroicons-arrow-up-tray"
                      variant="outline"
                      color="blue"
                      @click="() => toast.add({ title: 'Not implemented yet!' })"
                      :disabled="loading"
                    >
                      Upload file
                    </UButton>
                  </div>
                </div>
              </template>
              <ObservationList :observations="observations" :project="project" />
              <div class="flex w-full justify-center">
                <UPagination v-if="totalPages > 1" v-model="page" :total="totalObservations" />
              </div>
            </UCard>
          </div>
          <div v-else-if="item.key === 'collaborators'" class="mt-6">
            <CollaboratorWidget v-if="showContributors" :project="project" />
          </div>
          <div v-else-if="item.key === 'export'" class="grid grid-cols-2 gap-6 mt-6">
            <UCard>
              <template #header>
                <div class="flex justify-between items-center">
                  <p>Dynamic fields</p>
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
              <DynamicFieldList :project="project" />
            </UCard>
            <UCard>
              <template #header>
                <div class="flex justify-between">
                  Export
                  <UBadge color="yellow">WARN: In development</UBadge>
                </div>
              </template>
            </UCard>
          </div>
        </template>
      </UTabs>
    </UContainer>
    <ModalCreateDynamicField
      v-if="project"
      :project="project"
      :open="openCreateDynamicFieldModal"
      :on-close="onCloseDynamicFieldModal"
    />
  </ResourceAccessChecker>
    
</template>

<script lang="ts" setup>
  const error = ref(null)
  const { ensureLoggedIn } = await useAuth();
  const { hasRoles } = await useUser();
  const { requireProjectFromParams } = await useProjects();
  await ensureLoggedIn();
  const { params } = useRoute();
  const openCreateDynamicFieldModal = ref(false);
  const loading = ref(false);
  const toast = useToast();

  let project = requireProjectFromParams(params);
  if (typeof project?.id !== 'number') {
    throw new Error('Project is not defined');
  }

  const {
    createObservation,
    observations,
    totalPages,
    totalObservations,
    page
  } = await useObservations(project.id);

  const showContributors = computed(() => project?.id && hasRoles(project.id, ['OWNER']));

  const tabs = computed(() => {
    const result = [{
      key: 'observations',
      label: 'Observations',
    }];

    if (showContributors.value) {
      result.push({
        key: 'collaborators',
        label: 'Collaborators',
      })
    }

    result.push({
      key: 'export',
      label: 'Export data',
    });

    return result;
  });



  async function addObservationClick () {
    if (typeof project?.id !== 'number') {
      throw new Error('Project is not defined');
    }
    loading.value = true;
    await createObservation(project.id).catch(
      (err) => error.value = err?.message
    ).catch(() =>loading.value = false).then((res) => {
      // dum ux hack :s
      if (res?.id && project?.id) {
        navigateTo(`/projects/${project.id}/observations/${res.id}`)
      }
    });
  }

  async function onCloseDynamicFieldModal () {
    openCreateDynamicFieldModal.value = false;
  }
</script>