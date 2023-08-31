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
    </UCard>
  </UContainer>
</template>

<script lang="ts" setup>
  const error = ref(null)
  const { ensureLoggedIn } = await useAuth();
  const { ensureHasOwnership, requireProjectFromParams, projects } = await useProjects();
  const { createObservation, refreshObservations, observations } = await useObservations();
  const { params } = useRoute();

  await ensureLoggedIn();
  ensureHasOwnership(params?.projectId, projects.value);

  const project = requireProjectFromParams(params);

  // TODO: optimize this to run through SSR
  await refreshObservations(project.id);

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