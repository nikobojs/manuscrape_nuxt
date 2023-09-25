<template>
  <div
    class="grid md:grid-cols-2 sm:grid-cols-1 grid-cols-1 gap-y-4 gap-x-4"
    v-if="observation"
  >
    <UCard class="overflow-visible">
      <template #header>
        Metadata
        <span v-if="!$props.disabled && metadataDone" class="ml-2 i-heroicons-check text-lg text-green-500"></span>
      </template>
      <ObservationForm
        v-if="observation"
        :project="project"
        :observation="observation"
        :onSubmit="onFormSubmit"
        :disabled="disabled"
      />
    </UCard>

    <UCard>
      <template #header>
          Image
          <span v-if="!$props.disabled && imageUploaded" class="ml-2 i-heroicons-check text-lg text-green-500"></span>
      </template>
      <ObservationImageForm
        :project="project"
        :observation="observation"
        :onSubmit="onImageUploaded"
        :disabled="disabled"
        :imageUploaded="imageUploaded"
        :uploadInProgress="uploadInProgress"
      />
    </UCard>

    <UCard>
      <template v-if="!$props.disabled" #header>
          Files
      </template>
      <ObservationFileUploadForm
        :observation="observation"
        :project="project"
        :on-file-uploaded="onFileUploaded"
        :on-video-capture-uploaded="onVideoCaptureUploaded"
      />
    </UCard>

    <div>
      <UCard v-if="!$props.disabled" >
        <template #header>
          Save
        </template>
        <p>
          When an observation is committed, it will be locked for changes permanently. This includes file uploading, image editing and metadata editing.
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
          Details
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
    if (runsInElectron()) {
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