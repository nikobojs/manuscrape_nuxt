<template>
  <div>
    <UCard>
      <template #header>
        <div class="flex justify-between w-full relative">
          <CardHeader>Images</CardHeader>
          <div>
            <div
              class="absolute right-0 top-0 -translate-y-1/4"
              v-if="isElectron"
            >
              <div class="">
                <UButton
                  v-if="inputsWithImage.length > 0"
                  @click="takeAnotherScreenshot"
                  color="white"
                  size="sm"
                  class="ring-slate-400 focus:ring-slate-200 hover:ring-slate-200 text-slate-300 hover:text-slate-100 transition-all"
                  variant="outline"
                >
                  {{
                    inputsWithImage.length === 1 &&
                    inputsWithImage[0]!.field.type !== "IMAGE_MULTIPLE"
                      ? "Replace image"
                      : "Take another"
                  }}
                  <UIcon class="text-lg" name="mdi:image-size-select-large" />
                </UButton>
              </div>
            </div>
            <span
              v-if="!disabled && imageUploaded"
              class="ml-2 text-lg text-green-500"
            >
              <UIcon name="i-heroicons-check" />
            </span>
          </div>
        </div>
      </template>
      <div>
        <div class="flex flex-col gap-6">
          <div
            v-for="inp in inputsWithImage as {
              field: NewProjectField & { id: number };
              props: CMSImageProps | CMSImagesProps;
              images: ImageUpload[];
            }[]"
          >
            <div class="flex flex-col gap-3">
              <p class="text-sm">{{ inp.props.label }}:</p>
              <ImageUploadInput
                :editable="observation.isDraft"
                :removable="observation.isDraft"
                :project="project"
                :observation="observation"
                :images="inp.images"
                :required="inp.field.required"
                :multiple="inp.field.type === 'IMAGE_MULTIPLE'"
                @change="(ev: Event) => onFilePicked(ev, inp.field.id, true)"
                @add="(ev: Event) => onFilePicked(ev, inp.field.id, false)"
                @remove="(imgId: number) => onDeleteImageUpload(imgId)"
              />
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Modal for pre-upload editing (web only) -->
    <UModal v-model="showEditorModal" fullscreen>
      <UCard class="w-full">
        <template #header>
          <div class="flex justify-between items-center">
            <CardHeader> Edit image before uploading </CardHeader>
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              @click="closeModal"
            />
          </div>
        </template>
        <UContainer>
          <ObservationImageEditor
            v-if="pendingFile && project && activeProjectFieldId"
            :project="project"
            :observation="observation"
            :initial-file="pendingFile"
            :project-field-id="activeProjectFieldId"
            :on-submit="handleModalUploadSuccess"
          />
        </UContainer>
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
  inputs: {
    type: Array as PropType<CMSInput[]>,
    required: true,
  },
  project: requireProjectProp,
  onSubmit: Function as PropType<() => Promise<void>>,
  disabled: Boolean as PropType<boolean>,
  imageUploaded: Boolean as PropType<boolean>,
});

if (!props.project?.id) {
  throw new Error("Project id is not defined");
}

const toast = useToast();
const file = ref<File | undefined>();
const { isElectron } = useDevice();
const observation = computed(() => props.observation);
const { report } = useSentry();

// New state for pre-upload editing
const showEditorModal = ref(false);
const pendingFile = ref<File | undefined>();
const fileInput = ref<HTMLInputElement | undefined>();
const activeProjectFieldId = ref<null | number>(null);

const config = useRuntimeConfig().public;

const inputsWithImage = computed(() =>
  props.inputs.map((i) => ({
    ...i,
    images: observation.value.images.filter(
      (img) => img.projectFieldId === i.field.id,
    ),
  })),
);

function findExistingImage(projectFieldId: number) {
  return observation.value.images.find(
    (i) => i.projectFieldId === projectFieldId,
  );
}

function takeAnotherScreenshot() {
  if (observation.value) {
    window.electronAPI.takeAnother(observation.value.id);
  } else {
    const errMsg =
      "Unable to take another screenshot - observation is undefined";
    report("error", errMsg);
    toast.add({
      description: errMsg,
      color: "red",
    });
  }
}

async function onDeleteImageUpload(imgId: number) {
  const res = await fetch(
    `/api/projects/${props.project.id}/observations/${props.observation.id}/image-uploads/${imgId}`,
    {
      method: "DELETE",
    },
  );

  if (res.status !== 204) {
    let json;
    try {
      json = await res.json();
    } catch {}
    console.log("got error json:", json);
    toast.add({
      title: "Image file could not be deleted",
      description: json?.message || "Unknown error",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  } else {
    toast.add({
      title: "Image deleted successfully",
      icon: "i-heroicons-check",
      color: "green",
    });
    props.onSubmit?.();
  }
}

async function onFilePicked(
  event: any,
  projectFieldId: number,
  overwriteExisting: boolean,
) {
  console.log({ event, projectFieldId, overwriteExisting });
  const files = event?.target?.files || [];
  if (files.length == 0) {
    return;
  }
  for (const img of files) {
    // ensure size is ok
    if (img.size > config.maxImageSize) {
      toast.add({
        title: "Image file is too big",
        description: "Maximum size allowed is " + formatMb(config.maxImageSize),
        icon: "i-heroicons-exclamation-triangle",
        color: "red",
      });
      // Reset file input
      if (fileInput.value) {
        fileInput.value.value = "";
      }
      return;
    }
  }

  if (overwriteExisting) {
    const existingImage = findExistingImage(projectFieldId);

    // ensure overwriting of image is confirmed by user
    if (existingImage) {
      // TODO: create nice confirm box
      const res = confirm(
        "Are you sure you want to overwrite the existing image? You will still be able to edit the image before it is uploaded",
      );
      if (!res) {
        // Reset file input
        if (fileInput.value) {
          fileInput.value.value = "";
        }
        return;
      }
    }
  }

  activeProjectFieldId.value = projectFieldId;
  file.value = files[0] as File;

  // For new images (no existing image), allow pre-upload editing
  if (isElectron.value) {
    // For Electron: store file in sessionStorage and navigate to edit page
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Store only the data part (after the comma)
      const base64Data = base64.split(",")[1];
      sessionStorage.setItem(
        "pendingImageFile",
        JSON.stringify({
          name: file.value!.name,
          type: file.value!.type,
          data: base64Data,
        }),
      );
      // Navigate to edit page
      const electronParam = "?electron=1";
      navigateTo(
        `/projects/${props.project.id}/observations/${props.observation.id}/edit-image-new${electronParam}`,
      );
    };
    reader.readAsDataURL(file.value);
  } else {
    pendingFile.value = file.value;
    showEditorModal.value = true;
  }

  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = "";
  }
}

function closeModal() {
  showEditorModal.value = false;
  pendingFile.value = undefined;
}

async function handleModalUploadSuccess() {
  closeModal();
  toast.add({
    title: "Image uploaded successfully",
    icon: "i-heroicons-check",
    color: "green",
  });
  props.onSubmit?.();
}
</script>
