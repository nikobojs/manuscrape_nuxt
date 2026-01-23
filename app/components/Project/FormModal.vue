<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="onClose"
    :ui="{
      background: 'bg-transparent dark:bg-transparent',
      width: 'max-w-full sm:max-w-4xl lg:max-w-4xl xl:max-w-4xl',
      shadow: 'shadow-none'
    }"
    prevent-close
  >
    <ProjectCreateWidget :onClose="onClose" />
  </UModal>
</template>

<script setup lang="ts">
  defineProps({
    ...requireModalProps,
  });
</script>