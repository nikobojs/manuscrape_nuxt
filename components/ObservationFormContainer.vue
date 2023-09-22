<template>
  <div
    class="grid md:grid-cols-2 sm:grid-cols-1 grid-cols-1 gap-y-4 gap-x-4"
    v-if="observation"
  >
    <UCard class="overflow-visible">
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

    <div v-if="!$props.disabled" class="flex gap-4">
      <UButton class="mt-6" :disabled="!imageUploaded || !metadataDone" @click="() => publish()">
        Submit observation
      </UButton>
      <UButton color="red" variant="outline" class="mt-6" @click="() => discard()">
        Discard
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps({
    onObservationPublished: Function as PropType<Function>,
    onFormSubmit: Function as PropType<Function>,
    onImageUploaded: Function as PropType<(isFirstImage: boolean) => Promise<void>>,
    disabled: Boolean as PropType<boolean>,
    awaitImageUpload: Boolean as PropType<boolean>,
    metadataDone: Boolean as PropType<boolean>,
    imageUploaded: Boolean as PropType<boolean>,
    observation: requireObservationProp,
    project: requireProjectProp,
  });

  const { publishObservation, deleteObservation } = await useObservations(props.project.id);
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