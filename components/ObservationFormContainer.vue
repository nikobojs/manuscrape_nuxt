<template>
  <div
    class="grid md:grid-cols-2 sm:grid-cols-1 grid-cols-1 gap-6"
    v-if="observation"
  >
    <ObservationMetadataWidget
      v-if="observation"
      :project="project"
      :observation="observation"
      :onSubmit="onFormSubmit"
      :disabled="disabled"
      :metadataDone="metadataDone"
    />

    <ObservationImageWidget
      :project="project"
      :observation="observation"
      :onSubmit="onImageUploaded"
      :disabled="disabled"
      :imageUploaded="imageUploaded"
      :uploadInProgress="uploadInProgress"
    />

    <UCard>
      <template v-if="!$props.disabled" #header>
          <CardHeader>Files</CardHeader>
      </template>
      <ObservationFileUploadForm
        :observation="observation"
        :project="project"
        :on-file-uploaded="onFileUploaded"
        :on-video-capture-uploaded="onVideoCaptureUploaded"
      />
    </UCard>

    <div>
      <UCard v-if="!$props.disabled">
        <template #header>
          <CardHeader>Actions</CardHeader>
        </template>
        <p class="text-sm italic text-gray-100">
          Warning: When an observation is committed, it will be locked for future editing.
          This includes uploading files, image editing and metadata editing.
        </p>
        <div class="flex gap-4 mt-6">
          <UButton icon="i-heroicons-lock-closed" class="" :disabled="!imageUploaded || !metadataDone" @click="() => publish()">
            Commit and lock
          </UButton>
          <UButton icon="i-mdi-delete-outline" color="red" variant="outline" @click="() => discard()">
            Delete observation draft
          </UButton>
        </div>
      </UCard>
      <UCard v-else="$props.disabled" >
        <template #header>
          <CardHeader>Details</CardHeader>
        </template>
        <div class="grid grid-cols-2 w-full border border-gray-700 rounded-md bg-slate-950 p-3">
          <div class="text-gray-400">ID:</div>
          <div>#{{ observation.id }}</div>
          <div class="text-gray-400">Created by:</div>
          <div>{{ observation.user?.email || 'Unknown' }}</div>
          <div class="text-gray-400">Draft created at:</div>
          <div>{{ prettyDate(observation.createdAt, true) }}</div>
          <div class="text-gray-400">Last updated at:</div>
          <div>{{ prettyDate(observation.updatedAt, true) }}</div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps({
    onObservationPublished: Function as PropType<Function>,
    onFormSubmit: Function as PropType<Function>,
    onImageUploaded: Function as PropType<(isFirstImage: boolean) => Promise<void>>,
    onFileUploaded: requireFunctionProp<(file: File) => Promise<void>>(),
    onVideoCaptureUploaded: requireFunctionProp<() => Promise<void>>(),
    disabled: Boolean as PropType<boolean>,
    awaitImageUpload: Boolean as PropType<boolean>,
    metadataDone: Boolean as PropType<boolean>,
    imageUploaded: Boolean as PropType<boolean>,
    observation: requireObservationProp,
    project: requireProjectProp,
  });

  const {
    publishObservation,
    deleteObservation,
  } = await useObservations(props.project.id);
  const toast = useToast();
  const { isElectron } = useDevice();

  const uploadInProgress = computed(() => {
    return props.awaitImageUpload && !props.observation?.image?.id;
  })

  async function publish() {
    await publishObservation(props.project.id, props.observation.id);
    props.onObservationPublished?.();
  }

  async function discard() {
    if (!props.project || !props.observation) {
      throw new Error('Props are not defined')
    }
    await deleteObservation(props.project.id, props.observation.id);
    if (isElectron.value) {
      window.close();
    } else {
      toast.add({
        title: 'Draft has been deleted',
        color: 'green',
        icon: 'i-heroicons-check'
      });
      navigateTo(`/projects/${props.project.id}`);
    }
  }

</script>