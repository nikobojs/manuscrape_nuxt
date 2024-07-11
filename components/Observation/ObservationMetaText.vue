<template>
    <div class="flex flex-col [&>div]:grid sm:[&>div]:grid-cols-[130px_1fr] [&>div]:gap-y-1 [&>div]:gap-x-3 text-sm text-gray-500">
      <div>
        <span>Observation id:</span>
        <span class="">#{{ observation.id }}</span>
      </div>
      <div v-if="observation">
        <span>Created at:</span>
        <span class="">{{ prettyDate(observation.createdAt) }}</span>
      </div>
      <div v-if="observation">
        <span>Last updated:</span>
        <span class="">{{ prettyDate(observation.updatedAt) }}</span>
      </div>
    </div>
</template>

<script lang="ts" setup>
  const props = defineProps({
    observation: requireObservationProp,
  });
</script>