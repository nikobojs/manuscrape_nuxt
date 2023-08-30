<template>
  <!-- TODOOOOOO: SHOW IMAGE FILE AND A SAVE IMAGE BUTTON THAT CALLS submit() -->
</template>

<script lang="ts" setup>
  const props = defineProps({
    file: File as PropType<File>,
    observation: Object as PropType<FullObservation>,
    project: Object as PropType<FullProject>,
    onSubmit: Function as PropType<() => Promise<void>>,
  });

  const { upsertObservationImage, refreshObservations } = await useObservations();

  async function submit() {
    if (!props.file) {
      throw new Error('Image file has not been selected');
    }

    try {
      if (props.observation && props.project) {
        await upsertObservationImage(
          props.project.id,
          props.observation.id,
          props.file
        )
        await refreshObservations(props.project.id);
        props.onSubmit?.();
      } else {
        throw new Error('Project or observation id was not found');
      }
    } catch(err) {
      console.log('Upload image submit error:', err);
      throw err;
    }
  }
</script>