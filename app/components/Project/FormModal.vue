<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="
      () => {
        /* ignore event */
      }
    "
    :ui="{
      background: 'bg-transparent dark:bg-transparent',
      width: 'max-w-full sm:max-w-4xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-6xl',
      shadow: 'shadow-none',
    }"
  >
    <ProjectCreateWidget :onClose="onClose" cancelable translate-y />
  </UModal>
</template>

<script setup lang="ts">
defineProps({
  ...requireModalProps,
});
</script>
