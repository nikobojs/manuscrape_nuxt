<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="onClose"
    :ui="{background: 'transparent', width: 'sm:max-w-xl lg:max-w-2xl xl:max-w-4xl', shadow: 'shadow-none'}"
    prevent-close
  >
    <ProjectForm :onClose="onClose" />
  </UModal>
</template>

<script setup lang="ts">
  defineProps({
    ...requireModalProps,
  });
</script>