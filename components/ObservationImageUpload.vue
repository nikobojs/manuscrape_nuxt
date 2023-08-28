
<template>
  <UCard v-if="!uploadInProgress">
    <div class="mb-4 font-bold">Observation metadata</div>
    <div v-if="!uploadInProgress">
      <UForm ref="form" :state="state" @submit.prevent="submit">
        <input type="file" :on:change="onFilePicked" />
        <UButton class="mt-4" type="submit" :disabled="!file">Upload image</UButton>
      </UForm>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
  const props = defineProps({
    project: Object as PropType<FullProject>,
    observation: Object as PropType<FullObservation>,
    onSubmit: Function as PropType<Function>,
    uploadInProgress: Boolean as PropType<Boolean>,
  });


  const form = ref();
  const state = ref({
    file: null as (File | null)
  });

  const toast = useToast();
  const { upsertObservationImage, refreshObservations } = await useObservations();

  const file = ref()

  function onFilePicked(event: any) {
    const files = event?.target?.files || [];
    if (files.length == 0) {
      return;
    } else if (files.length > 1) {
      throw new Error('Only one file can be uploaded at a time')
    }

    file.value = event.target.files[0] as File;
  }

  onMounted(() => {
    if (props.uploadInProgress) {
      setTimeout(() => {
        toast.add({
          title: 'Uploading takes longer than usual',
          description: 'This could indicate something went wrong :('
        });
      }, 20000)
    }
  })


  async function submit() {
    if (!file.value) {
      throw new Error('Image file has not been selected');
    }

    if (props.observation?.image) {
      // TODO: create nice confirm box
      const res = confirm('Are you sure you want to overwrite the existing file?');
      if (!res) {
        return;
      }
    }
  
    try {
      await form.value!.validate();
    } catch {
      // ignore because form dependency takes care of visualising errors
    }

    try {
      if (props.observation && props.project) {
        await upsertObservationImage(
          props.project.id,
          props.observation.id,
          file.value
        )
        await refreshObservations(props.project.id);
        toast.add({
          title: 'Image saved on observation',
        });
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