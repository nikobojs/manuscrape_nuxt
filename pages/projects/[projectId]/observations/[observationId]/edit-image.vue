<template>
  <UContainer>
    <ObservationImageEditor :project="project" :observation="observation" />
  </UContainer>
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
  const { params } = useRoute();
  const { ensureHasOwnership, requireProjectFromParams, projects } = await useProjects();
  ensureHasOwnership(params?.projectId, projects.value);
  const project = requireProjectFromParams(params);
  const { requireObservationFromParams, observations } = await useObservations(project.id);
  const _observation = await requireObservationFromParams(params);
  const observation = ref(_observation);

  watch(() => observations, async () => {
    const _observation = await requireObservationFromParams(params);
    observation.value = _observation;
  }, { deep: true });
</script>