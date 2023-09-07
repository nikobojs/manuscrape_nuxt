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
        :onSubmit="onDataSubmitted"
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
  const toast = useToast();
  const { publishObservation } = await useObservations();
  const props = defineProps({
    project: Object as PropType<FullProject>,
    observation: Object as PropType<FullObservation>,
    onObservationPublished: Function as PropType<Function>,
    disabled: Boolean as PropType<boolean>,
    awaitImageUpload: Boolean as PropType<boolean>
  });

  const metadataDone = computed(() => !!props.observation?.data && !!Object.keys(props.observation.data).length);
  const imageUploaded = computed(() => {
    return typeof props.observation?.image?.id === 'number';
  });

  const uploadInProgress = computed(() => {
    return props.awaitImageUpload && !props.observation?.image?.id;
  })

  async function onDataSubmitted() {
    if (!runsInElectron()) {
      toast.add({
        title: 'Observation data was saved.'
      });
    }
  }

  async function onImageUploaded() {
    if (!props.observation?.id || !props.project?.id) {
      toast.add({
        title: props.observation ? 'Observation does not exist' : 'Project does not exist',
        icon: 'i-heroicons-exclamation-triangle',
        color: 'red'
      });
    } else {
      toast.add({
        title: 'Image uploaded successfully',
      });
    }
  }

  async function publish() {
    if (!props.project || !props.observation) {
      throw new Error('Props are not defined')
    }
    await publishObservation(props.project.id, props.observation.id);
    props.onObservationPublished?.();
  }

</script>