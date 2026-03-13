<template>
    <UContainer>
      <BackButton
        v-if="isElectron && project"
        :href="`/projects/${project.id}/drafts?electron=1`"
      >
        Go to drafts
      </BackButton>
      <BackButton
        v-else-if="!isElectron && project"
        :href="`/projects/${project.id}`"
      >
        Go to project
      </BackButton>
      <BackButton v-else :href="'/'"> Go back </BackButton>
      <div class="mb-6 flex justify-between items-center">
        <h2 class="text-3xl flex gap-x-4">
          {{ header }}
          <span
            v-if="!isLocked"
            class="text-blue-400 i-heroicons-lock-open block"
          ></span>
          <span
            v-else
            class="text-green-400 i-heroicons-lock-closed block"
          ></span>
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
        :observation="observation"
        :onObservationPublished="onObservationPublished"
        :onImageUploaded="onImageUploaded"
        :onFormSubmit="onFormSubmit"
        :onDelockObservation="onDelockObservation"
        :metadataDone="metadataDone"
        :imageUploaded="imageUploaded"
        :onFileUploaded="onFileUploaded"
        :onFileDeleted="onFileDeleted"
      />
    </UContainer>
</template>

<script lang="ts" setup>
const { ensureLoggedIn } = await useAuth();
await useUser();
await ensureLoggedIn();
const { params, query } = useRoute();
const { project } = await useProjects(params);
if (typeof project.value?.id !== "number") {
  throw new Error("Project is not defined");
}
const { refreshObservations, requireObservationFromParams } = await useObservations(
  project.value?.id,
);
const observation = ref<FullObservation | null>(null);
const { isElectron } = useDevice();

const isLocked = computed(
  () => observation.value != null && !observation.value.isDraft,
);
const header = computed(() =>
  isLocked.value ? "Observation details" : "Edit observation draft",
);
const toast = useToast();

const metadataDone = ref(metadataIsDone(observation.value?.data));
watch(
  [observation],
  ([obs]) => {
    const isDone = metadataIsDone(obs?.data);
    imageUploaded.value = !!observation.value?.image;
    metadataDone.value = isDone;
  },
  { deep: true },
);

const imageUploaded = ref(false);

async function refreshObservation() {
  const obs = await requireObservationFromParams(params);
  observation.value = obs;
}

function metadataIsDone(data: any): boolean {
  if (!project.value?.fields) return false;
  const formErrors = validateObservationForm(data, project.value.fields);
  return formErrors.length === 0;
}

async function onObservationPublished() {
  if (isElectron.value) {
    window.electronAPI.observationCreated?.();
  } else {
    if (typeof project.value?.id !== "number") {
      throw new Error("Project is not defined");
    }
    toast.add({
      title: "Nice job! Observation was submitted.",
      icon: "i-heroicons-check",
      color: "green",
    });
    await refreshObservation();
    await refreshObservations();
  }
}

async function onFormSubmit(showToast = true) {
  if (!isElectron.value && showToast) {
    toast.add({
      title: "Observation data was saved.",
    });
  }
  await refreshObservation();
  metadataDone.value = true;
}

async function onDelockObservation() {
  await refreshObservation();
  await refreshObservations();
}

async function onImageUploaded() {
  if (!observation.value?.id || !project.value?.id) {
    toast.add({
      title: observation
        ? "Observation does not exist"
        : "Project does not exist",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  } else {
    // redundant
    // toast.add({
    //   title: "Image uploaded successfully",
    // });
  }
  await refreshObservation();
}

async function onFileUploaded(file: File) {
  if (!observation.value?.id || !project.value?.id) {
    toast.add({
      title: observation
        ? "Observation does not exist"
        : "Project does not exist",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  } else {
    toast.add({
      title: `'${file.name}' was uploaded successfully`,
      color: "green",
      icon: "i-heroicons-check",
    });
  }
  await refreshObservation();
}

async function onFileDeleted() {
  if (!observation.value?.id || !project.value?.id) {
    toast.add({
      title: observation
        ? "Observation does not exist"
        : "Project does not exist",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  } else {
    toast.add({
      title: `File was deleted successfully`,
      color: "green",
      icon: "i-heroicons-check",
    });
  }
  await refreshObservation();
  await refreshObservations();
}

onMounted(async () => {
    await refreshObservation();
    await refreshObservations();
});
</script>
