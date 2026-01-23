<template>
  <ResourceAccessChecker>
    <UContainer>
      <BackButton
        v-if="isElectron && project"
        :href="`/projects/${project.id}/drafts?electron=1`">
        Go to drafts
      </BackButton>
      <BackButton v-else-if="!isElectron && project" :href="`/projects/${project.id}`">
        Go to project
      </BackButton>
      <BackButton v-else :href="'/'"> Go back </BackButton>
      <div class="mb-6 flex justify-between items-center">
        <h2 class="text-3xl flex gap-x-4">
          {{ header }}
          <span v-if="!isLocked" class="text-blue-400 i-heroicons-lock-open block"></span>
          <span v-else class="text-green-400 i-heroicons-lock-closed block"></span>
        </h2>
          <ObservationMetaText
          class="text-right"
            v-if="observation"
            :observation="observation"
          />
      </div>
      <ObservationFormContainer
        v-if="observation && project"
        :project="project"
        :observationId="observation.id"
        :onObservationPublished="onObservationPublished"
        :awaitImageUpload="awaitImageUpload"
        :onImageUploaded="onImageUploaded"
        :onFormSubmit="onFormSubmit"
        :onDelockObservation="onDelockObservation"
        :metadataDone="metadataDone"
        :imageUploaded="imageUploaded"
        :onFileUploaded="onFileUploaded"
        :onFileDeleted="onFileDeleted"
      />
    </UContainer>
  </ResourceAccessChecker>
</template>

<script lang="ts" setup>
const { ensureLoggedIn } = await useAuth();
await useUser();
await ensureLoggedIn();
const { params, query } = useRoute();
const { project } = await useProjects(params);
if (typeof project.value?.id !== 'number') {
  throw new Error('Project is not defined');
}
const { refreshObservations, observations } = await useObservations(project.value?.id);
const { requireObservationFromParams } = await useObservations(project.value.id);
const observation = ref<FullObservation | null>(null);
const awaitImageUpload = computed(() => query?.uploading === '1');
const imageInterval = ref<number | null>(null);
const { isElectron } = useDevice();

async function refreshObservation() {
  if (observation.value !== null) {
    await refreshObservations();
    const obs = observations.value.find((o) => o.id === (observation.value || {}).id);
    if (obs) {
      observation.value = { ...obs };
    } else {
      const _observation = await requireObservationFromParams(params);
      observation.value = _observation;
    }
  } else {
    const _observation = await requireObservationFromParams(params);
    observation.value = _observation;
  }
}

await refreshObservation();

const isLocked = computed(() => observation.value != null && !observation.value.isDraft);
const header = computed(() =>
  isLocked.value ? 'Observation details' : 'Edit observation draft'
);
const toast = useToast();

const metadataDone = ref(false);
watch([observation], ([obs]) => {
  const isDone = metadataIsDone(obs?.data);
  metadataDone.value = isDone;
}, {deep: true});

const imageUploaded = computed(() => {
  const imageFound = typeof observation.value?.image?.id === 'number';
  const intervalIsRunning = typeof imageInterval.value === 'number';
  if (imageFound && intervalIsRunning) {
    window.clearInterval(imageInterval.value!);
    imageInterval.value = null;
  }
  return imageFound;
});

// TODO: validate using actual project field definition
function metadataIsDone(data: any): boolean {
  if (!data) return false;
  let json: Record<string,any>;
  try {
    if (typeof data === 'string') {
      json = JSON.parse(data)
    } else {
      throw new Error('Observation data is not a string');
    }
  } catch(e) {
    return false;
  }
  if (!json) return false;
  if (Object.keys(json).length === 0) return false;
  return true;
}

async function onObservationPublished() {
  if (isElectron.value) {
    window.electronAPI.observationCreated?.();
  } else {
    if (typeof project.value?.id !== 'number') {
      throw new Error('Project is not defined');
    }
    toast.add({
      title: 'Nice job! Observation was submitted.',
      icon: 'i-heroicons-check',
      color: 'green',
    });
    await refreshObservation();
  }
}

async function onFormSubmit() {
  if (!isElectron.value) {
    toast.add({
      title: 'Observation data was saved.',
    });
  }
  await refreshObservation();
  metadataDone.value = true;
}

async function onDelockObservation() {
  await refreshObservation();
}

async function onImageUploaded() {
  if (!observation.value?.id || !project.value?.id) {
    toast.add({
      title: observation ? 'Observation does not exist' : 'Project does not exist',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
    });
  } else {
    toast.add({
      title: 'Image uploaded successfully',
    });
  }
  await refreshObservation();
}

async function onFileUploaded(file: File) {
  if (!observation.value?.id || !project.value?.id) {
    toast.add({
      title: observation ? 'Observation does not exist' : 'Project does not exist',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
    });
  } else {
    toast.add({
      title: `'${file.name}' was uploaded successfully`,
      color: 'green',
      icon: 'i-heroicons-check',
    });
  }
  await refreshObservation();
}

async function onFileDeleted() {
  if (!observation.value?.id || !project.value?.id) {
    toast.add({
      title: observation ? 'Observation does not exist' : 'Project does not exist',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red',
    });
  } else {
    toast.add({
      title: `File was deleted successfully`,
      color: 'green',
      icon: 'i-heroicons-check',
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
    }, 10000);
  } else {
    await refreshObservation();
  }
});
</script>
