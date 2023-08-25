<template>
  <h3 class="text-lg mb-3">Observations:</h3>
  <UTable :rows="props.observations"></UTable>
</template>

<script lang="ts" setup>
  const props = defineProps({
    observations: Object as PropType<FullObservation[]>,
  })
</script>