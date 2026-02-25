<template>
  <div>
    <UCard>
      <template #header>
        <div class="flex justify-between w-full">
          <CardHeader>Image</CardHeader>
          <span
            v-if="!$props.disabled && imageUploaded"
            class="ml-2 i-heroicons-check text-lg text-green-500"
          ></span>
        </div>
      </template>
      <div v-if="!uploadInProgress">
        <label class="block" v-if="!$props.disabled">
          <UInput
            ref="fileInput"
            class="hidden"
            type="file"
            accept="image/png, image/jpeg"
            :on:change="onFilePicked"
          />
          <div class="text-sm">
            <div
              v-if="!$props.disabled"
              class="underline text-green-500 cursor-pointer"
            >
              {{ observation?.image ? "Change image" : "Choose image" }}
            </div>
          </div>
        </label>
        <div v-if="uploaded">
          <NuxtLink
            v-if="observation?.image && !$props.disabled"
            class="text-sm underline text-green-500 cursor-pointer"
            :href="`/projects/${project?.id}/observations/${observation?.id}/edit-image${isElectron ? '?electron=1' : ''}`"
          >
            Edit image
          </NuxtLink>
          <ObservationImageThumbnail
            v-if="observation"
            class="mt-6 mb-4"
            :image="uploaded"
            :observation="observation"
            :project="project"
            :last-update="lastImageUpdate"
          />
        </div>
      </div>
      <div v-else class="flex gap-x-1 items-center">
        <Spinner />
        Processing image...
      </div>
    </UCard>

    <!-- Modal for pre-upload editing (web only) -->
    <UModal
      v-model="showEditorModal"
      :ui="{ container: 'fixed inset-0' }"
    >
      <UCard class="w-full max-w-6xl">
        <template #header>
          <div class="flex justify-between items-center">
            <CardHeader>Edit image before uploading</CardHeader>
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              @click="closeModal"
            />
          </div>
        </template>
        <ObservationImageEditor
          v-if="pendingFile && project"
          :project="project"
          :observation="observation"
          :initial-file="pendingFile"
          :on-submit="handleModalUploadSuccess"
        />
      </UCard>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import { formatMb } from "#imports";

const props = defineProps({
  observation: {
    type: Object as PropType<FullObservation>,
    required: true,
  },
  project: requireProjectProp,
  onSubmit: Function as PropType<(isFirstImage: boolean) => Promise<void>>,
  disabled: Boolean as PropType<boolean>,
  imageUploaded: Boolean as PropType<boolean>,
  uploadInProgress: Boolean as PropType<boolean>,
});

if (!props.project?.id) {
  throw new Error("Project id is not defined");
}

const toast = useToast();
const { upsertObservationImage, observations } = await useObservations(
  props.project.id,
);
const file = ref<File | undefined>();
const uploadChecker = ref();
const route = useRoute();
const router = useRouter();
const { isElectron } = useDevice();
const observation = computed(() => props.observation);

// New state for pre-upload editing
const showEditorModal = ref(false);
const pendingFile = ref<File | undefined>();
const fileInput = ref<HTMLInputElement | undefined>();

const uploaded = computed(
  () => observation.value?.image?.id && observation.value?.image,
);
const timeout = ref<null | number>(null);
const config = useRuntimeConfig().public;
const lastImageUpdate = computed(() => {
  return (
    (observation.value?.image?.createdAt &&
      new Date(observation.value.image.createdAt)) ||
    undefined
  );
});

async function onFilePicked(event: any) {
  const files = event?.target?.files || [];
  if (files.length == 0) {
    return;
  } else if (files.length > 1) {
    throw new Error("Only one file can be uploaded at a time");
  }

  // ensure size is ok
  if (files[0].size > config.maxImageSize) {
    toast.add({
      title: "Image file is too big",
      description: "Maximum size allowed is " + formatMb(config.maxImageSize),
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    return;
  }

  // ensure overwriting of image is confirmed by user
  if (observation.value?.image) {
    // TODO: create nice confirm box
    const res = confirm(
      "Are you sure you want to overwrite the existing image?",
    );
    if (!res) {
      // Reset file input
      if (fileInput.value) {
        fileInput.value.value = '';
      }
      return;
    }
  }

  file.value = files[0] as File;

  // For new images (no existing image), allow pre-upload editing
  if (!observation.value?.image) {
    if (isElectron.value) {
      // For Electron: store file in sessionStorage and navigate to edit page
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Store only the data part (after the comma)
        const base64Data = base64.split(',')[1];
        sessionStorage.setItem('pendingImageFile', JSON.stringify({
          name: file.value!.name,
          type: file.value!.type,
          data: base64Data,
        }));
        // Navigate to edit page
        const electronParam = '?electron=1';
        navigateTo(`/projects/${props.project.id}/observations/${props.observation.id}/edit-image-new${electronParam}`);
      };
      reader.readAsDataURL(file.value);
    } else {
      // For Web: show modal with editor
      pendingFile.value = file.value;
      showEditorModal.value = true;
    }
  } else {
    // For existing images: upload directly and let user edit afterwards
    try {
      await upsertObservationImage(
        props.project.id,
        props.observation.id,
        file.value,
      )
        .then(async () => {
          if (typeof props.project?.id !== "number") {
            throw new Error("Project id is not found");
          }
          const isFirstImage = !!uploaded.value;
          props.onSubmit?.(isFirstImage);
        })
        .catch((e: any) => {
          let msg = "An error occured when uploading image";
          if (e.message) {
            msg = e.message;
          }
          toast.add({
            title: "Image upload error",
            description: msg,
            icon: "i-heroicons-exclamation-triangle",
            color: "red",
          });
        });
    } catch (err) {
      console.error("Upload image submit error:", err);
      throw err;
    }
  }

  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function closeModal() {
  showEditorModal.value = false;
  pendingFile.value = undefined;
}

async function handleModalUploadSuccess(isFirstImage: boolean) {
  closeModal();
  toast.add({
    title: "Image uploaded successfully",
    icon: "i-heroicons-check",
    color: "green",
  });
  props.onSubmit?.(isFirstImage);
}

// TODO: document better
async function handleIfUploadDone(): Promise<void> {
  if (!props.uploadInProgress) {
    setTimeout(async () => {
      router.replace({ query: { electron: route.query?.electron || 0 } });
      window.clearInterval(uploadChecker.value);
      timeout.value !== null && clearTimeout(timeout.value);
      uploadChecker.value = null;
    }, 10);
  }
}

// TODO: improve error handling and implement for ordinary file upload
onBeforeMount(async () => {
  if (props.imageUploaded) {
    await handleIfUploadDone();
  } else if (props.uploadInProgress) {
    // handle timeout on image upload
    timeout.value = window.setTimeout(() => {
      if (props.uploadInProgress) {
        toast.add({
          title: "Uploading takes longer than usual",
          description:
            "This could indicate something went wrong. Try to refresh the page.",
        });
        uploadChecker.value && window.clearInterval(uploadChecker.value);
        uploadChecker.value = null;
      }
    }, 20000);

    // check and handle if image was uploaded
    uploadChecker.value = window.setInterval(handleIfUploadDone, 2000);
  }
});
</script>
