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
      :onImagesChange="refreshObservation"
      :onTagCreated="refreshObservation"
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
const { refreshObservations, requireObservationFromParams } =
  await useObservations(project.value?.id);
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
    ((imageUploaded.value = requiredImagesUploaded()),
      (metadataDone.value = isDone));
  },
  { deep: true },
);

const imageUploaded = ref(false);

// returns true if all required images are uploaded
function requiredImagesUploaded(): boolean {
  if (!project.value) throw new Error("Project is not defined");
  if (!observation.value) throw new Error("Observation is not defined");
  const requiredFields = project.value.fields.filter((f) => f.required);
  const imageSingleFields = requiredFields.filter((f) =>
    f.type.includes("IMAGE_SINGLE"),
  );
  const imageMultipleFields = requiredFields.filter((f) =>
    f.type.includes("IMAGE_MULTIPLE"),
  );

  // get unique project field ids from uploaded images
  const imgProjectFields = Array.from(
    new Set(observation.value.images.map((img) => img.projectFieldId)),
  );
  for (const single of imageSingleFields) {
    if (!imgProjectFields.includes(single.projectId)) return false;
  }
  for (const multiple of imageMultipleFields) {
    if (!imgProjectFields.includes(multiple.projectId)) return false;
  }
  return true;
}

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
      description: "Observation parameters was successfully saved",
      color: "green",
      icon: "i-mdi-check",
    });
  }
  await refreshObservation();
  metadataDone.value = true;
}

async function onDelockObservation() {
  await refreshObservation();
  await refreshObservations();
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
