<template>
  <div>
    <div v-if="imageSrc">
      <img :src="imageSrc" />
    </div>
    <div v-if="!imageSrc && !uploadInProgress">
      Observation has no image
    </div>
    <div v-if="uploadInProgress">
      Processing and uploading picture...
    </div>
  </div>
</template>

<script lang="ts" setup>
  const props = defineProps({
    project: Object as PropType<FullProject>,
    observation: Object as PropType<FullObservation>,
    uploadInProgress: Boolean as PropType<Boolean>,
  });

  const { public: config } = useRuntimeConfig();
  
  function getImageSrc(observation: FullObservation) {
    let result;

    if (observation && observation?.image?.id && props.project) {
      result = `${config.baseUrl}/api/projects/${props.project.id}/observations/${observation.id}/image?now=${new Date().getTime()}`;
    }

    return result;
  }

  const imageSrc = computed(() => {
    if (!props.observation) {
      throw new Error('No observation')
    }
    const src = getImageSrc(props.observation)
    return src;
  })
</script>