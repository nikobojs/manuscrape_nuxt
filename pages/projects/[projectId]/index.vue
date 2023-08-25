<template>
  <UContainer>
    <h2 class="text-3xl mb-3">{{ project?.name }}</h2>
    <UCard class="mb-4">
      <ObservationList :observations="observations" />
      <div class="text-right">
        <UButton
          icon="i-heroicons-pencil-square"
          variant="outline"
          @click="addObservationClick"
        >
          Add observation
        </UButton>
      </div>
    </UCard>
  </UContainer>
</template>

<script lang="ts" setup>
  const error = ref(null)
  const { ensureLoggedIn } = await useAuth();
  const { refreshUser, user } = await useUser();
  await ensureLoggedIn();
  const { params } = useRoute();
  const { ensureHasOwnership, requireProjectFromParams, projects } = await useProjects();
  const { createObservation, refreshObservations, observations } = await useObservations();

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