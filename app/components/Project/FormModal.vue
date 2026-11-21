<template>
  <UModal
    :open="open"
    :ui="{
      content:
        'bg-transparent shadow-none max-w-full sm:max-w-4xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-6xl ring-0!',
    }"
    :scrollable="false"
  >
    <template #content>
      <ProjectCreateWidget :on-close="() => emit('close')" cancelable />
    </template>
  </UModal>
</template>

<script setup lang="ts">
defineProps({
  ...requireModalProps,
});

const emit = defineEmits<{
  close: [];
}>();
</script>
