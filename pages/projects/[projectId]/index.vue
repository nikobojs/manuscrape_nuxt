<template>
  <ResourceAccessChecker>
    <UContainer>
      <UTabs :items="tabs" :default-index="0">
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
                    >
                      Create observation
                    </UButton>
                    <UButton
                      icon="i-heroicons-arrow-up-tray"
                      variant="outline"
                      color="blue"
                      @click="addObservationClick"
                    >
                      Upload media
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
                Dynamic fields
              </template>
              <p>Dynamic fields will be generated automagically when exporting observations</p>
              <div class="grid grid-cols-3">
                <div class="col-span-1">
                  <DynamicFieldForm :project="project" />
                </div>
                <div class="col-span-2">
                  <DynamicFieldList :project="project" />
                </div>
              </div>
            </UCard>
            <UCard>
              <template #header>
                Export
              </template>
            </UCard>
          </div>
        </template>
      </UTabs>
    </UContainer>
  </ResourceAccessChecker>
</template>

<script lang="ts" setup>
  const error = ref(null)
  const { ensureLoggedIn } = await useAuth();
  const { hasRoles } = await useUser();
  const { requireProjectFromParams } = await useProjects();

  await ensureLoggedIn();
  const { params } = useRoute();

  const project = requireProjectFromParams(params);

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

  const showContributors = computed(() => hasRoles(project.id, ['OWNER']));

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
    const res = await createObservation(project.id).catch(
      (err) => error.value = err?.message
    ).then((res) => {
      if (res?.id) {
        navigateTo(`/projects/${project.id}/observations/${res.id}`);
      }
    });
  }
</script>