<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="closeObservationImage"
  >
      <div v-if="imageSrc">
        <img :src="imageSrc" />
      </div>
      <div v-if="!imageSrc">
        Observation has no image
      </div>
  </UModal>
</template>

<script lang="ts" setup>
  const props = defineProps({
    project: requireProjectProp,
    observation: requireObservationProp,
    ...requireModalProps,
    lastUpdate: Date as PropType<Date>,
  });

  const { public: config } = useRuntimeConfig();

  function closeObservationImage() {
    props.onClose?.();
  }

  
  function getImageSrc(observation: FullObservation, lastUpdate: Date) {
    let result;

    if (observation && observation?.image?.id && props.project) {
      result = `${config.baseUrl}/api/projects/${props.project.id}/observations/${observation.id}/image?now=${lastUpdate.getTime()}`;
    }

    return result;
  }

  const imageSrc = computed(() => {
    if (!props.observation) {
      throw new Error('No observation')
    }
    const src = getImageSrc(props.observation, new Date());
    return src;
  })
</script>