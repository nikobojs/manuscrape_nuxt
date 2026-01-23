<template>
  <div class="mb-3 text-sm flex gap-x-1.5 items-center text-blue-500">
    <UIcon name="i-heroicons-arrow-uturn-left" />
    <NuxtLink :href="href"><slot /></NuxtLink>
  </div>
</template>

<script setup lang="ts">
  defineProps({
    href: {
      type: String as PropType<string>,
      required: true,
    }
  });
</script>