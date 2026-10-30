<template>
  <UModal
    v-model="props.open"
    @close="closeObservationImage"
    :ui="{
      base: 'relative text-left rtl:text-right overflow-hidden flex flex-col',
    }"
  >
    <div class="flex justify-end">
      <!-- NOTE: gives keyboard users a way to close the modal and gives the
        focus trap a focusable element (otherwise headlessui warns on open) -->
      <UButton
        icon="i-heroicons-x-mark"
        color="gray"
        variant="ghost"
        aria-label="Close image viewer"
        @click="closeObservationImage"
      />
    </div>
    <div v-for="src in imageSrcs">
      <img :src="src" />
    </div>
  </UModal>
</template>

<script lang="ts" setup>
const props = defineProps({
  project: requireProjectProp,
  observation: requireObservationProp,
  ...requireModalProps,
  lastUpdate: Date as PropType<Date>,
});

function closeObservationImage() {
  props.onClose?.();
}

const imageSrcs = computed(() =>
  (props.observation?.images || []).map((img) => {
    const result = [];
    const src = `/api/projects/${props.project.id}/observations/${props.observation.id}/image-uploads/${img.id}?projectFieldId=${img.projectFieldId}&latestUpdate=${props.lastUpdate?.getTime()}`;
    result.push(src);
    return src;
  }),
);
</script>
