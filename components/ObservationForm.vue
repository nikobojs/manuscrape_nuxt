<template>
  <div v-if="step === 0">
    <h3 class="text-2xl">Create observation</h3>
    <div class="text-sm mb-4">STEP 1 OF 3</div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 sm:grid-cols-1 grid-cols-1">
      <ObservationDataForm
        class="col-span-1"
        v-if="observation"
        :project="project"
        :observation="observation"
        :onSubmit="onDataSubmitted"
      />
      <div class="col-span-3"></div>
    </div>
  </div>
  <div v-if="step === 1">
    <h3 class="text-2xl">Upload image</h3>
    <div class="text-sm mb-4">STEP 2 OF 3</div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 sm:grid-cols-1 grid-cols-1 gap-y-10" v-if="observation">
      <ObservationImageUpload
        class="col-span-1"
        :project="project"
        :observation="observation"
        :onSubmit="onImageUploaded"
        :uploadInProgress="uploadInProgress"
      />
      <ObservationImageView
        class="col-span-1"
        :project="project"
        :observation="observation"
        :uploadInProgress="uploadInProgress"
      />
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
  const metadataDone = ref(false)
  const step = ref(0);

  async function onDataSubmitted() {
    metadataDone.value = true;
    await new Promise((r) => setTimeout(r, 150));
    gotoStep(1);
  }

  function gotoStep(n: number) {
    step.value = n;
  }

  async function onImageUploaded() {
    if (!props.observation?.id || !props.project?.id) {
      toast.add({
        title: props.observation ? 'Observation does not exist' : 'Project does not exist',
        icon: 'i-heroicons-exclamation-triangle',
        color: 'red'
      });
      navigateTo('/');
    } else {
      await publishObservation(props.project.id, props.observation.id);
      props.onObservationPublished?.();
    }
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