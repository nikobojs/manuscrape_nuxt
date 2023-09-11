<template>
  <UContainer>
    <h2 class="text-3xl mb-3">{{ project?.name }}</h2>
    <UCard class="mb-4">
      <template #header>
      <div class="flex items-center justify-between w-full">
        Observations
        <div class="text-right">
          <UButton
            icon="i-heroicons-pencil-square"
            variant="outline"
            @click="addObservationClick"
          >
            Add observation
          </UButton>
        </div>
      </div>
      </template>
      <ObservationList :observations="observations" :project="project" />
      <div class="flex w-full justify-center">
        <UPagination v-if="totalPages > 1" v-model="page" :total="totalObservations" />
      </div>
    </UCard>
    <CollaboratorWidget v-if="showContributors" :project="project" />
  </UContainer>
</template>

<script lang="ts" setup>
  const error = ref(null)
  const { ensureLoggedIn } = await useAuth();
  const { hasRoles } = await useUser();
  const { ensureHasOwnership, requireProjectFromParams, projects } = await useProjects();

  await ensureLoggedIn();
  const { params } = useRoute();

  const project = requireProjectFromParams(params);
  ensureHasOwnership(project.id, projects.value);

  const {
    createObservation,
    observations,
    totalPages,
    totalObservations,
    page
  } = await useObservations(project.id);

  const showContributors = computed(() => hasRoles(project.id, ['OWNER']));

  async function addObservationClick () {
    const res = await createObservation(project.id).catch(
      (err) => error.value = err?.message
    ).then((res) => {
      if (res?.id) {
        navigateTo(`/projects/${project.id}/observations/${res.id}`);
      }
    });
  }
</script>