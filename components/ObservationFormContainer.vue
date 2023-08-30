<template>
  <div
    class="grid md:grid-cols-2 lg:grid-cols-3 sm:grid-cols-1 grid-cols-1 gap-y-4 gap-x-4"
    v-if="observation"
  >
    <UCard>
      <template #header>
        Insert metadata
      </template>
      <ObservationForm
        class="col-span-1"
        v-if="observation"
        :project="project"
        :observation="observation"
        :onSubmit="onDataSubmitted"
      />
      <span class="pl-1 i-heroicons-check text-lg text-green-500" v-if="imageUploaded"></span>
    </UCard>

    <UCard class="col-span-2">
      <template #header>
          Upload image
      </template>
      <ObservationImageForm
        :project="project"
        :observation="observation"
        :onSubmit="onImageUploaded"
        :uploadInProgress="uploadInProgress"
      />
    </UCard>

    <div>
      <UButton class="mt-6" :disabled="!imageUploaded || !metadataDone" @click="() => publish()">
        Add observation
      </UButton>
    </div>

    <ObservationImageDialog
      :project="project"
      :observation="observation"
      :open="openImageDialog"
      :on-close="() => openImageDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
  const toast = useToast();
  const { publishObservation } = await useObservations();
  const props = defineProps({
    project: Object as PropType<FullProject>,
    observation: Object as PropType<FullObservation>,
    onObservationPublished: Function as PropType<Function>,
    uploadInProgress: Boolean as PropType<Boolean>,
  });

  const route = useRoute();
  const metadataDone = ref(false)
  const imageUploaded = ref(!!props.observation?.image);
  const openImageDialog = ref(false);

  async function onDataSubmitted() {
    metadataDone.value = true;
    // TODO: make this more safe
    if (!runsInElectron()) {
      toast.add({
        title: 'Observation data was saved.'
      });
    }
    
    await new Promise((r) => setTimeout(r, 150));
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
      imageUploaded.value = true;
    }
  }

  async function publish() {
    if (!props.project || !props.observation) {
      throw new Error('Props are not defined')
    }
    await publishObservation(props.project.id, props.observation.id);
    props.onObservationPublished?.();
  }

  // listen if image was automatically uploaded and the rest is done
  watch([
    () => props.uploadInProgress,
    () => route.query.uploading,
    () => metadataDone.value
  ], () => {
    if (
      runsInElectron() &&
      props.uploadInProgress === false &&
      route.query.uploading === '1' &&
      metadataDone.value === true
    ) {
      onImageUploaded();
    }

  }, { deep: true, immediate: true })

</script>