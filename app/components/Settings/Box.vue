<script setup lang="ts">
defineProps({
  title: requireProp<string>(String),
  description: requireProp<string>(String),
});
</script>

<template>
  <!-- <UCard class="bg-[#11151e] col-span-2"> -->
  <UCard
    class="bg-transparent col-span-2 ring-0 shadow-none"
    :ui="{
      body: 'px-0 py-5 sm:px-0',
      header: 'px-0 py-5 sm:px-0',
    }"
  >
    <template #header>
      <CardHeader>{{ title }}</CardHeader>
    </template>
    <p class="mb-6 max-w-lg">{{ description }}</p>
    <slot />
  </UCard>
</template>
