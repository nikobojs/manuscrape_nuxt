<template>
  <div v-if="step === 0">
    <h3 class="text-2xl">Create observation in "{{project?.name}}"</h3>
    <div class="text-sm mb-4">STEP 1 OF 3</div>
    <div class="grid grid-cols-4">
      <ObservationDataForm
        class="col-span-1"
        v-if="observation"
        :project="project"
        :observation="observation"
        :onSubmit="() => gotoStep(1)"
      />
      <div class="col-span-3"></div>
    </div>
  </div>
  <div v-if="step === 1">
    <h3 class="text-2xl">Upload raw png image:</h3>
    <div class="text-sm mb-4">STEP 2 OF 3 (can be skipped using <a href="https;//github.com/nikobojs/manuscrape_electron">manuscrape_electron</a>)</div>
    <div class="grid grid-cols-4" v-if="observation">
      <ObservationImageUpload
        class="col-span-1"
        :project="project"
        :observation="observation"
        :onSubmit="onImageUploaded"
      />
      <ObservationImageView
        class="col-span-2"
        :project="project"
        :observation="observation"
      />
      <div class="col-span-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const toast = useToast();
  const { publishObservation } = await useObservations();
  const props = defineProps({
    project: Object as PropType<FullProject>,
    observation: Object as PropType<FullObservation>,
    onObservationPublished: Function as PropType<Function>
  });

  const step = ref(0);
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

</script>