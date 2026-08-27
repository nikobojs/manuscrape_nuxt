<template>
  <UContainer>
    <UButton
      v-if="project && observation"
      @click="handleDiscard"
      :disabled="disableBackbutton"
      color="red"
      variant="ghost"
      class="mb-3 text-sm flex gap-x-1.5 items-center"
    >
      <UIcon name="i-heroicons-x-mark" />
      Discard
    </UButton>
    <ObservationImageEditor
      v-if="project && initialFile && observation && projectFieldId"
      :project="project"
      :observation="observation"
      :initial-file="initialFile"
      :on-submit="handleUploadSuccess"
      :project-field-id="projectFieldId"
    />
    <UCard v-else class="p-8 text-center">
      <p class="text-gray-500" v-if="project && observation">
        {{
          error || "No image file provided. Please go back and select an image."
        }}
      </p>
      <p v-else-if="loading || !observation">Loading..</p>
    </UCard>
  </UContainer>
</template>

<script lang="ts" setup>
const { deleteObservation } = await import("#imports");
const { ensureLoggedIn, ensureUserFetched } = await useAuth();
await useUser();
await ensureUserFetched(); // this is apparently required for this page to work correctly in electron
await ensureLoggedIn();
const route = useRoute();
const { project, loading } = await useProjects(route.params);
const toast = useToast();
const projectFieldId = ref<number>();
const error = ref<string>();
const { report } = useSentry();
const { isElectron } = useDevice();

const disableBackbutton = ref(false);

if (typeof route.params.projectId !== "string" || !route.params.projectId) {
  throw new Error("Project is not defined");
}

const observation = ref<FullObservation | null>(null);

async function refreshObservation() {
  if (import.meta.server || !route.params?.projectId) return;
  if (!project.value) throw new Error("Project is not defined");
  const projId = requireNumber(project.value.id);
  const obsId = requireNumber(route.params?.observationId);
  const obs = await fetchObservationById(projId, obsId);

  if (!obs) {
    toast.add({
      title: "Error",
      description: "Observation does not seem to exist.",
    });
  } else {
    observation.value = obs;
  }
}

// load image as fast as possible through IPC (replaces sessionStorage)
onBeforeMount(() => {
  if (isElectron.value && window.electronAPI?.useLocalImg) {
    window?.electronAPI?.useLocalImg((data: string) => {
      // Convert base64 back to File
      // TODO: handle errors better
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      initialFile.value = new File([byteArray], "image.jpg", {
        type: "image/jpg",
      });
    });
  }
});

// Get the initial file from sessionStorage (stored by the widget before navigation)
const initialFile = ref<File | undefined>(undefined);
onMounted(async () => {
  // refresh observation
  try {
    await refreshObservation();
  } catch (e: unknown) {
    if ((e as { message?: string; status?: number })?.status) {
      report("error", e as Error);
      const status = (e as any).status;
      if (status === 403) {
        toast.add({
          description: "You do not have access to this observation or project",
          color: "red",
          icon: "i-heroicons-exclamation-triangle",
        });
        return navigateTo("/");
      } else {
        toast.add({
          description: (e as any)?.message || "Unknown error",
          color: "red",
          icon: "i-heroicons-exclamation-triangle",
        });
        return navigateTo("/");
      }
    }
    console.error("Got error:", e);
    throw e;
  }

  // retrieve (require) `projectFieldId` from query parameters
  const _projectFieldId = route.query?.projectFieldId;
  if (
    typeof _projectFieldId !== "string" ||
    !_projectFieldId ||
    isNaN(parseInt(_projectFieldId))
  ) {
    error.value = "Project field id is not defined in the URL query parameters";
    return;
  }
  projectFieldId.value = parseInt(_projectFieldId);

  // TODO: deprecate after manuscrape_electron 0.1.14 2026-04-28
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

async function handleDiscard() {
  if (!project.value || !observation.value) {
    return;
  }
  try {
    await deleteObservation(project.value.id, observation.value.id);
    if (isElectron.value) {
      window.close();
    }
  } catch (e) {
    toast.add({
      title: "Failed to discard",
      description: (e as Error)?.message || "Unknown error",
      color: "red",
      icon: "i-heroicons-exclamation-triangle",
    });
  }
}

async function handleUploadSuccess(isFirstImage: boolean) {
  if (isElectron.value) {
    // For Electron, just close the window after successful upload
    toast.add({
      title: "Image uploaded successfully",
      icon: "i-heroicons-check",
      color: "green",
    });
    window.close();
  } else {
    // For web, navigate back to observation
    toast.add({
      title: "Image uploaded successfully",
      icon: "i-heroicons-check",
      color: "green",
    });
    const electronParam = isElectron.value ? "?electron=1" : "";
    await navigateTo(`/projects/${project.value?.id}/observations/${observation.value?.id}${electronParam}`);
  }
}
</script>
