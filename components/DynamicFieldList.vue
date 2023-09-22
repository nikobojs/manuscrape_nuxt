<template>
  <div>
    <UTable :rows="dynamicFields" :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'No dynamic fields.' }"  />
  </div>
</template>

<script setup lang="ts">
  const props = defineProps({
    project: requireProjectProp,
  });

  const dynamicFields = computed(() => props.project.dynamicFields);
</script>