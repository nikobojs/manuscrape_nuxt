<template>
  <div
    class="grid md:grid-cols-2 sm:grid-cols-1 grid-cols-1 gap-6 auto-rows-min"
    v-if="observation">
    <ObservationMetadataWidget
      class="row-span-4"
      :project="project"
      :observationId="observationId"
      :onSubmit="onFormSubmit"
      :disabled="isLocked"
      :metadataDone="metadataDone"
      :initialState="observationForm.initialState"
      :inputs="observationForm.inputs" />

    <div class="row-span-3 flex flex-col gap-6">
      <ObservationImageWidget
        :project="project"
        :observationId="observationId"
        :onSubmit="onImageUploaded"
        :disabled="isLocked"
        :imageUploaded="imageUploaded"
        :uploadInProgress="uploadInProgress" />

      <UCard v-if="!isLocked || (isLocked && observation.fileUploads.length > 0)">
        <template #header>
          <CardHeader>Files</CardHeader>
        </template>
        <ObservationFileUploadForm
          :observation="observation"
          :project="project"
          :on-file-uploaded="onFileUploaded"
          :on-file-deleted="onFileDeleted"
          :on-video-capture-uploaded="onVideoCaptureUploaded" />
      </UCard>

      <UCard v-if="!isLocked">
        <template #header>
          <CardHeader>Actions</CardHeader>
        </template>
        <div class="flex gap-4 mb-6">
          <UButton
            icon="i-heroicons-lock-closed"
            class=""
            :disabled="!imageUploaded || !metadataDone"
            @click="() => handlePublishObservation()">
            Submit and lock
          </UButton>
          <UButton
            v-if="isDeletable"
            icon="i-mdi-delete-outline"
            color="red"
            variant="outline"
            @click="() => handleDiscardDraft()">
            Delete draft
          </UButton>
        </div>
        <UAlert
          variant="outline"
          icon="i-mdi-information-outline"
          color="blue"
          title="Submit and lock"
          v-if="!isDelockable"
          description="When an observation is submitted, it will be locked for future editing.
          This includes uploading files, image editing and metadata editing."
          :ui="{ title: 'text-sm font-bold' }" />
      </UCard>
      <UCard v-else="observation">
        <template #header>
          <CardHeader>Details</CardHeader>
        </template>
        <div
          class="grid grid-cols-2 w-full border border-gray-700 rounded-md bg-slate-950 p-3">
          <div class="text-gray-400">ID:</div>
          <div>#{{ observation.id }}</div>
          <div class="text-gray-400">Created by:</div>
          <div>{{ observation.user?.email || 'Unknown' }}</div>
          <div class="text-gray-400">Draft created at:</div>
          <div>{{ prettyDate(observation.createdAt, true) }}</div>
          <div class="text-gray-400">Last updated at:</div>
          <div>{{ prettyDate(observation.updatedAt, true) }}</div>
        </div>
        <div class="flex gap-x-4">
          <div class="mt-6" v-if="isDelockable">
            <UButton
              icon="i-mdi-lock-open-variant-outline"
              color="yellow"
              variant="outline"
              @click="() => handleDelock()">
              Unlock observation
            </UButton>
          </div>
          <div class="mt-6" v-if="isDeletable">
            <UButton
              icon="i-mdi-delete-outline"
              color="red"
              variant="outline"
              @click="() => handleDelete()">
              Delete observation
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  onObservationPublished: Function as PropType<Function>,
  onFormSubmit: Function as PropType<Function>,
  onDelockObservation: Function as PropType<Function>,
  onImageUploaded: Function as PropType<(isFirstImage: boolean) => Promise<void>>,
  onFileUploaded: requireFunctionProp<(file: File) => Promise<void>>(),
  onFileDeleted: requireFunctionProp<() => Promise<void>>(),
  onVideoCaptureUploaded: requireFunctionProp<() => Promise<void>>(),
  awaitImageUpload: Boolean as PropType<boolean>,
  metadataDone: Boolean as PropType<boolean>,
  imageUploaded: Boolean as PropType<boolean>,
  observationId: {
    type: Number,
    required: true,
  },
  project: requireProjectProp,
});

const { user } = await useUser();

const observationForm = computed(() => buildForm(props.project.fields));
const {
  deleteObservation,
  patchObservation,
  observationIsDeletable,
  observationIsDelockable,
  observations,
} = await useObservations(props.project.id);
const toast = useToast();
const { isElectron } = useDevice();

const observation = computed(() =>
  observations.value.find((o) => o.id === props.observationId)
);

const isDeletable = computed(() =>
  observationIsDeletable(observation.value, user.value, props.project)
);

const isDelockable = computed(() =>
  observationIsDelockable(observation.value, user.value, props.project)
);

const isLocked = computed(() => observation.value != null && !observation.value.isDraft);

const uploadInProgress = computed(() => {
  return observation.value && props.awaitImageUpload && !observation.value?.image?.id;
});

async function handlePublishObservation() {
  const _ = await patchObservation(props.project.id, props.observationId, {
    isDraft: false,
  });
  props.onObservationPublished?.();
}

async function handleDelock() {
  if (!props.project || !observation) {
    throw new Error('Props are not defined');
  }
  const confirmed = confirm(
    `Are you sure you want to unlock observation #${props.observationId} ?`
  );
  if (!confirmed) return;

  try {
    const _ = await patchObservation(props.project.id, props.observationId, {
      isDraft: true,
    });
    toast.add({
      title: 'Observation unlocked successfully',
      color: 'green',
      icon: 'i-heroicons-check',
    });
    props.onDelockObservation?.();
  } catch (e) {
    const msg = getErrMsg(e);
    toast.add({
      title: msg,
      color: 'red',
    });
  }
}

async function handleDiscardDraft() {
  if (!props.project || !observation) {
    throw new Error('Props are not defined');
  }
  const confirmed = confirm('Are you sure you want to delete this draft?');
  if (!confirmed) return;

  await deleteObservation(props.project.id, props.observationId);
  if (isElectron.value) {
    window.close();
  } else {
    toast.add({
      title: 'Draft has been deleted',
      color: 'green',
      icon: 'i-heroicons-check',
    });
    navigateTo(`/projects/${props.project.id}`);
  }
}

async function handleDelete() {
  if (!props.project || !observation) {
    throw new Error('Props are not defined');
  }
  const confirmed = confirm(
    `Are you sure you want to delete observation #${props.observationId} ?`
  );
  if (!confirmed) return;
  await deleteObservation(props.project.id, props.observationId);
  if (isElectron.value) {
    window.close();
  } else {
    toast.add({
      title: 'Observation has been deleted permanently',
      color: 'green',
      icon: 'i-heroicons-check',
    });
    navigateTo(`/projects/${props.project.id}`);
  }
}
</script>
