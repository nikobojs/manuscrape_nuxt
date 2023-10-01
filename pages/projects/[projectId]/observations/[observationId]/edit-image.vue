<template>
  <ResourceAccessChecker>
    <UContainer>
      <BackButton :href="`/projects/${project.id}/observations/${observation.id}`">
        Go back
      </BackButton>
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
  const { requireObservationFromParams } = await useObservations(project.id);
  const _observation = await requireObservationFromParams(params);
  const observation = ref(_observation);
</script>