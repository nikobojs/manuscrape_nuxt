<script setup lang="ts">
  const props = defineProps({
    title: {
      currentStep: String as PropType<String>,
    },
    help: {
      currentStep: String as PropType<String>,
    },
  });
</script>

<template>
  <!-- <UCard class="dark:bg-[#11151e] col-span-2 bg-[#11151e]"> -->
  <UCard
    class="dark:bg-transparent col-span-2 bg-transparent ring-0 dark:ring-0 shadow-none"
    :ui="{
      body: {
        padding: 'px-0 py-5 sm:px-0',
      },
      header: {
        padding: 'px-0 py-5 sm:px-0',
      },
    }"
  >
    <template #header>
      <CardHeader>{{ title }}</CardHeader>
    </template>
    <p class="mb-6 max-w-lg">{{ help }}</p>
    <slot />
  </UCard>
</template>