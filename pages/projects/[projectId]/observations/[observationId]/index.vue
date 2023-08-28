<template>
  <UContainer>
    <ObservationForm
      :project="project"
      :observation="observation"
      :onObservationPublished="onSubmit"
      :uploadInProgress="uploadInProgress"
    />
  </UContainer>
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
  const { params, query } = useRoute();
  const { ensureHasOwnership, requireProjectFromParams, projects } = await useProjects();
  const { requireObservationFromParams, observations } = await useObservations();
  ensureHasOwnership(params?.projectId, projects.value);
  const project = requireProjectFromParams(params);
  const _observation = await requireObservationFromParams(params);
  const observation = ref(_observation);
  const uploadInProgress = ref(query.uploading === '1');

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

  if (runsInElectron()) {
    window.electronAPI?.observationImageUploaded?.(() => {
      uploadInProgress.value = false;
    });
  }
</script>