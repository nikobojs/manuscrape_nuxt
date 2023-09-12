<template>
  <UContainer>
    <h2 class="text-3xl mb-6 flex gap-x-4">
      {{ header }}
      <span v-if="!isLocked" class="text-blue-400 i-heroicons-lock-open block"></span>
      <span v-else class="text-green-400 i-heroicons-lock-closed block"></span>
    </h2>
    <ObservationFormContainer
      v-if="observation"
      :project="project"
      :observation="observation"
      :onObservationPublished="onSubmit"
      :disabled="isLocked"
      :awaitImageUpload="awaitImageUpload"
      :onImageUploaded="onImageUploaded"
      :onFormSubmit="onFormSubmit"
      :metadataDone="metadataDone"
      :imageUploaded="imageUploaded"
    />
  </UContainer>
</template>

<script lang="ts" setup>
  const { ensureHasOwnership, requireProjectFromParams, projects } = await useProjects();
  await useUser();
  const { ensureLoggedIn } = await useAuth();
  await ensureLoggedIn();
  const { params, query } = useRoute();
  ensureHasOwnership(params?.projectId, projects.value);
  const project = requireProjectFromParams(params);
  const { requireObservationFromParams } = await useObservations(project.id);
  const observation = ref<FullObservation | null>(null);
  const awaitImageUpload = computed(() => query?.uploading === '1')
  const imageInterval = ref<number | null>(null)

  async function refreshObservation() {
    const _observation = await requireObservationFromParams(params);
    observation.value = _observation;
  }

  await refreshObservation();

  const isLocked = computed(() => observation.value != null && !observation.value.isDraft);
  const header = computed(() => isLocked ? 'Observation details' : 'Edit draft');
  const toast = useToast();

  const metadataDone = ref<boolean>(!!observation.value?.data && Object.keys(observation.value?.data).length > 0);
  const imageUploaded = computed(() => {
    const imageFound = typeof observation.value?.image?.id === 'number';
    const intervalIsRunning = typeof imageInterval.value === 'number';
    if (imageFound && intervalIsRunning) {
      window.clearInterval(imageInterval.value!);
      imageInterval.value = null;
    }
    return imageFound;
  });

  async function onSubmit() {
    if (runsInElectron()) {
      window.electronAPI.observationCreated?.();
    } else {
      navigateTo(`/projects/${project.id}`);
    }
  }
  
  async function onFormSubmit() {
    if (!runsInElectron()) {
      toast.add({
        title: 'Observation data was saved.'
      });
    }
    await refreshObservation();
    metadataDone.value = true;
  }

  async function onImageUploaded() {
    if (!observation.value?.id || !project?.id) {
      toast.add({
        title: observation ? 'Observation does not exist' : 'Project does not exist',
        icon: 'i-heroicons-exclamation-triangle',
        color: 'red'
      });
    } else {
      toast.add({
        title: 'Image uploaded successfully',
      });
    }
    await refreshObservation();
  }

  onMounted(async () => {
    if (!imageUploaded.value && awaitImageUpload.value) {

      imageInterval.value = window.setInterval(async () => {
        await refreshObservation();
      }, 1000);

      window.setTimeout(() => {
        window.clearInterval(imageInterval.value!);
        imageInterval.value = null;
      }, 10000)
    } else {
      await refreshObservation();
    }
  })

</script>