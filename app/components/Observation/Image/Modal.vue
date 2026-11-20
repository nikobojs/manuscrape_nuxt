<template>
  <UModal
    :open="open"
    @update:open="(value) => { if (!value) emit('close') }"
  >
    <template #content>
    <div class="flex justify-end">
      <!-- NOTE: gives keyboard users a way to close the modal and gives the
        focus trap a focusable element (otherwise headlessui warns on open) -->
      <UButton
        icon="i-heroicons-x-mark"
        color="neutral"
        variant="ghost"
        aria-label="Close image viewer"
        @click="emit('close')"
      />
    </div>
    <div v-for="src in imageSrcs">
      <img :src="src" />
    </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
const props = defineProps({
  project: requireProjectProp,
  observation: requireObservationProp,
  ...requireModalProps,
  lastUpdate: Date as PropType<Date>,
});

const emit = defineEmits<{
  close: [];
}>();

const imageSrcs = computed(() =>
  (props.observation?.images || []).map((img) => {
    const result = [];
    const src = `/api/projects/${props.project.id}/observations/${props.observation.id}/image-uploads/${img.id}?projectFieldId=${img.projectFieldId}&latestUpdate=${props.lastUpdate?.getTime()}`;
    result.push(src);
    return src;
  }),
);
</script>
