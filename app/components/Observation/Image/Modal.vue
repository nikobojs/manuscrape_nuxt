<template>
  <UModal
    v-model="props.open"
    @close="closeObservationImage"
    :ui="{
      base: 'relative text-left rtl:text-right overflow-hidden flex flex-col',
    }"
  >
    <div v-for="src in imageSrcs">
      <img :src="src" />
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
  console.log("closing observation image!");
  props.onClose?.();
}

const imageSrcs = computed(() =>
  (props.observation?.images || []).map((img) => {
    const result = [];
    const src = `${config.baseUrl}/api/projects/${props.project.id}/observations/${props.observation.id}/image-uploads/${img.id}?projectFieldId=${img.projectFieldId}&latestUpdate=${props.lastUpdate?.getTime()}`;
    result.push(src);
    return src;
  }),
);

// function getImageSrc(observation: FullObservation, lastUpdate: Date) {
//   let result;

//   if (observation && observation.images.length && props.project) {
//     result = `${config.baseUrl}/api/projects/${props.project.id}/observations/${observation.id}/image-uploads/${props.image.id}?projectFieldId=${props.image.projectFieldId}&latestUpdate=${lastUpdate.getTime()}`;
//   }

//   return result;
// }

// const imageSrc = computed(() => {
//   if (!props.observation) {
//     throw new Error("No observation");
//   }
//   const src = getImageSrc(props.observation, new Date());
//   return src;
// });
</script>
