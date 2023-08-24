
<template>
  <UCard>
    <div class="mb-4 font-bold">Observation metadata</div>
    <div>
      <UForm ref="form" :state="state" @submit.prevent="submit">
        <input type="file" :on:change="onFilePicked" />
        <UButton class="mt-4" type="submit">Upload image</UButton>
      </UForm>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
  import { Observation } from '@prisma/client';


  const props = defineProps({
    project: Object as PropType<FullProject>,
    observation: Object as PropType<Observation>,
  });


  const form = ref();
  const state = ref({
    file: null as (File | null)
  });

  const toast = useToast();
  const { upsertObservationImage } = await useObservations();
  const { refreshUser } = await useUser();

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


  async function submit() {
    if (!file.value) {
      throw new Error('Image file has not been selected');
    }
  
    try {
      await form.value!.validate();
    } catch {
      // ignore because form dependency takes care of visualising errors
    }

    try {
      if (props.observation && props.project) {
        await upsertObservationImage(
          props.project?.id,
          props.observation?.id,
          file.value
        )
        await refreshUser();
        toast.add({
          title: 'File was uploaded to observation',
        });
      } else {
        throw new Error('Project or observation id was not found');
      }
    } catch(err) {
      console.log('Upload image submit error:', err);
      throw err;
    }
    
  }
</script>