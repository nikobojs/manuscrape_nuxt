<template>
  <UContainer>
    <h2 class="text-3xl mb-6 flex gap-x-4">
      {{ header }}
      <span v-if="!isLocked" class="text-blue-400 i-heroicons-lock-open block"></span>
      <span v-else class="text-green-400 i-heroicons-lock-closed block"></span>
    </h2>
    <ObservationFormContainer
      :project="project"
      :observation="observation"
      :onObservationPublished="onSubmit"
      :disabled="isLocked"
    />
  </UContainer>
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
  const { params } = useRoute();
  const { ensureHasOwnership, requireProjectFromParams, projects } = await useProjects();
  const { requireObservationFromParams, observations } = await useObservations();
  ensureHasOwnership(params?.projectId, projects.value);
  const project = requireProjectFromParams(params);
  const _observation = await requireObservationFromParams(params);
  const observation = ref(_observation);

  watch(() => observations, async () => {
    const _observation = await requireObservationFromParams(params);
    observation.value = _observation;
  }, { deep: true });

  const isLocked = computed(() => !observation.value.isDraft);
  const header = computed(() => isLocked ? 'Observation details' : 'Edit draft');

  async function onSubmit() {
    if (runsInElectron()) {
      window.electronAPI.observationCreated?.();
    } else {
      navigateTo(`/projects/${project.id}`);
    }
  }
</script>