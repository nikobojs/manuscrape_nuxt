<template>
  <UContainer>
    <ObservationForm
      :project="project"
      :observation="observation"
      :onObservationPublished="onSubmit"
    />
  </UContainer>
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
  const { params } = useRoute();
  const { ensureHasOwnership, requireProjectFromParams, projects } = await useProjects();
  const { requireObservationFromParams, observations, publishObservation } = await useObservations();
  ensureHasOwnership(params?.projectId, projects.value);
  const project = requireProjectFromParams(params);
  const _observation = await requireObservationFromParams(params);
  const observation = ref(_observation);

  watch(() => observations, async () => {
    const _observation = await requireObservationFromParams(params);
    observation.value = _observation;
  }, { deep: true });

  async function onSubmit() {
    if (runsInElectron()) {
      window.electronAPI.observationCreated?.();
    } else {
      navigateTo(`/projects/${project.id}`);
    }
  }
</script>