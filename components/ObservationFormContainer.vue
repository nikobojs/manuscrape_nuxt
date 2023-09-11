<template>
  <div
    class="grid md:grid-cols-2 sm:grid-cols-1 grid-cols-1 gap-y-4 gap-x-4"
    v-if="observation"
  >
    <UCard>
      <template #header>
        Insert metadata
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
          Upload image
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

    <div v-if="!$props.disabled">
      <UButton class="mt-6" :disabled="!imageUploaded || !metadataDone" @click="() => publish()">
        Submit observation
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps({
    project: Object as PropType<FullProject>,
    observation: Object as PropType<FullObservation>,
    onObservationPublished: Function as PropType<Function>,
    onFormSubmit: Function as PropType<Function>,
    onImageUploaded: Function as PropType<(isFirstImage: boolean) => Promise<void>>,
    disabled: Boolean as PropType<boolean>,
    awaitImageUpload: Boolean as PropType<boolean>,
    metadataDone: Boolean as PropType<boolean>,
    imageUploaded: Boolean as PropType<boolean>,
  });

  if (!props.observation?.id || !props.project?.id) {
    throw new Error('Project id or observation id is not defined in url params')
  }

  const { publishObservation } = await useObservations(props.project.id);

  const uploadInProgress = computed(() => {
    return props.awaitImageUpload && !props.observation?.image?.id;
  })

  async function publish() {
    if (!props.project || !props.observation) {
      throw new Error('Props are not defined')
    }
    await publishObservation(props.project.id, props.observation.id);
    props.onObservationPublished?.();
  }

</script>