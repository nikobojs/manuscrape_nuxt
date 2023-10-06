<template>
  <ResourceAccessChecker>
    <UContainer>
      <BackButton
        :href="backbuttonUrl"
        :disabled="disableBackbutton"
      >
        Go back
      </BackButton>
      <ObservationImageEditor v-if="project" :project="project" :observation="observation" />
    </UContainer>
  </ResourceAccessChecker>
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
  const { params } = useRoute();
  const { isElectron } = useDevice();
  const {  project } = await useProjects(params);

  const disableBackbutton = ref(false);

  if (typeof project.value?.id !== 'number') {
    throw new Error('Project is not defined');
  }

  const backbuttonUrl = computed(() => {
    if (!project.value || !observation.value) {
      disableBackbutton.value = true;
      return '#'
    } else {
      const electronParam = isElectron ? '?electron=1' : '';
      return `
        /projects/${project.value.id}/observations/${observation.value.id}${electronParam}
      `.trim();
    }
  });

  const { requireObservationFromParams } = await useObservations(project.value.id);
  const _observation = await requireObservationFromParams(params);
  const observation = ref(_observation);
</script>