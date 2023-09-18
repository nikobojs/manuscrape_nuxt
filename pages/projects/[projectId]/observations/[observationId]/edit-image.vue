<template>
  <ResourceAccessChecker>
    <UContainer>
      <ObservationImageEditor :project="project" :observation="observation" />
    </UContainer>
  </ResourceAccessChecker>
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
  const { params } = useRoute();
  const { requireProjectFromParams } = await useProjects();
  const project = requireProjectFromParams(params);
  if (typeof project?.id !== 'number') {
    throw new Error('Project is not defined');
  }
  const { requireObservationFromParams, observations } = await useObservations(project.id);
  const _observation = await requireObservationFromParams(params);
  const observation = ref(_observation);

  watch(() => observations, async () => {
    const _observation = await requireObservationFromParams(params);
    observation.value = _observation;
  }, { deep: true });
</script>