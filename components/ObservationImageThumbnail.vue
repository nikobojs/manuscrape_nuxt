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

    <ObservationImageDialog
      :project="project"
      :observation="observation"
      :open="openImageDialog"
      :on-close="() => openImageDialog = false"
    />
  </div>
</template>

<script lang="ts" setup>
  import type { ImageUpload } from '@prisma/client';
  
  const props = defineProps({
    project: Object as PropType<FullProject>,
    observation: Object as PropType<FullObservation>,
    image: Object as PropType<ImageUpload>,
    lastUpdate: Date as PropType<Date>,
  });

  const openImageDialog = ref(false);
  
</script>