<template>
  <h3 class="text-lg mb-3">Observations:</h3>
  <UTable :rows="props.project.observations"></UTable>
</template>
<script setup>
  const props = defineProps({
    project: Object
  })
</script>