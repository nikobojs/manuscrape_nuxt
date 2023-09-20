<template>
  <div
    v-if="props.image"
    class="w-44 overflow-hidden h-40 border-dashed border-sky-700 rounded-lg shadow-black shadow-sm hover:shadow-md hover:border-sky-500 cursor-pointer border transition-all"
    @click="() => openImageDialog = true"
  >
    <img
      class="opacity-50"
      :src="`/api/projects/${project?.id}/observations/${observation?.id}/image?lastUpdate=${(props.lastUpdate || new Date()).getTime()}`"
    />

    <ModalObservationImage
      :project="project"
      :observation="observation"
      :open="openImageDialog"
      :on-close="() => openImageDialog = false"
    />
  </div>
</template>

<script lang="ts" setup>
  const props = defineProps({
    observation: requireObservationProp,
    project: requireProjectProp,
    image: Object as PropType<FullImage>,
    lastUpdate: Date as PropType<Date>,
  });

  const openImageDialog = ref(false);
  
</script>