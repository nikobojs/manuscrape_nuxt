<template>
  <div
    class="grid md:grid-cols-2 lg:grid-cols-3 sm:grid-cols-1 grid-cols-1 gap-y-4 gap-x-4"
    v-if="observation"
  >
    <UCard class="col-span-2">
      <template #header>
        Insert metadata
        <span class="ml-2 i-heroicons-check text-lg text-green-500" v-if="metadataDone"></span>
      </template>
      <ObservationForm
        class="col-span-1"
        v-if="observation"
        :project="project"
        :observation="observation"
        :onSubmit="onDataSubmitted"
      />
    </UCard>

    <UCard class="col-span-1">
      <template #header>
          Upload image
          <span class="ml-2 i-heroicons-check text-lg text-green-500" v-if="imageUploaded"></span>
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
  const metadataDone = ref(!!props.observation?.data && !!Object.keys(props.observation.data).length);
  const imageUploaded = ref(!!props.observation?.image);

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
      delete route.query.uploading;
      onImageUploaded();
    }

  }, { deep: true, immediate: true })

</script>