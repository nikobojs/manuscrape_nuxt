<template>
    <UContainer>
      <BackButton :href="backbuttonUrl" :disabled="disableBackbutton">
        Cancel
      </BackButton>
      <ObservationImageEditor
        v-if="project && initialFile && observation"
        :project="project"
        :observation="observation"
        :initial-file="initialFile"
        :on-submit="handleUploadSuccess"
      />
      <UCard v-else class="p-8 text-center">
        <p class="text-gray-500" v-if="project && observation">
          No image file provided. Please go back and select an image.
        </p>
        <p v-else-if="loading || !observation">Loading..</p>
      </UCard>
    </UContainer>
</template>

<script lang="ts" setup>
const { ensureLoggedIn } = await useAuth();
await useUser();
await ensureLoggedIn();
const { params } = useRoute();
const { isElectron } = useDevice();
const { project, loading } = await useProjects(params);
const toast = useToast();

const disableBackbutton = ref(false);

if (typeof project.value?.id !== "number") {
  throw new Error("Project is not defined");
}

const { requireObservationFromParams } = await useObservations(
  project.value.id,
);
const observation = ref<FullObservation | null>(null);

async function refreshObservation() {
  const obs = await requireObservationFromParams(params);
  observation.value = obs;
}


// Get the initial file from sessionStorage (stored by the widget before navigation)
const initialFile = ref<File | undefined>(undefined);
onMounted(async () => {
  await refreshObservation();
  const fileData = sessionStorage.getItem("pendingImageFile");
  if (fileData) {
    const { name, type, data } = JSON.parse(fileData);
    // Convert base64 back to File
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    initialFile.value = new File([byteArray], name, { type });
    // Clean up sessionStorage
    sessionStorage.removeItem("pendingImageFile");
  }
});

const backbuttonUrl = computed(() => {
  if (!project.value || !observation.value) {
    disableBackbutton.value = true;
    return "#";
  } else {
    const electronParam = isElectron.value ? "?electron=1" : "";
    return `
        /projects/${project.value.id}/observations/${observation.value.id}${electronParam}
      `.trim();
  }
});

async function handleUploadSuccess(isFirstImage: boolean) {
  if (isElectron.value) {
    // For Electron, just close the window after successful upload
    toast.add({
      title: "Image uploaded successfully",
      icon: "i-heroicons-check",
      color: "green",
    });
    // Navigate back to the observation
    await navigateTo(backbuttonUrl.value);
  } else {
    // For web, navigate back to observation
    toast.add({
      title: "Image uploaded successfully",
      icon: "i-heroicons-check",
      color: "green",
    });
    await navigateTo(backbuttonUrl.value);
  }
}
</script>
