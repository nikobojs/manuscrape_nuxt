
<template>
  <UCard>
    <div class="mb-4 font-bold">Observation metadata</div>
    <div>
      <UForm ref="form" :validate="validate" :state="state" @submit.prevent="submit">
        <input type="file" :on:change="onFilePicked" />
        <UButton class="mt-4" type="submit">Upload image</UButton>
      </UForm>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
  import type { FormError } from '@nuxthq/ui/dist/runtime/types/form';
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
  const { upsertObservationImage } = await useProjects();
  const file = ref()

  function validate(state: any): FormError[] {
    if (!props.project) {
      throw createError({
        statusMessage: 'Project does not exist',
        statusCode: 400,
      });
    }

    const errors = [] as FormError[];
    return errors;
  }

  function onFilePicked(event: any) {
    const files = event?.target?.files || [];
    if (files.length == 0) {
      return;
    } else if (files.length > 1) {
      throw new Error('Only one file can be uploaded at a time')
    }

    file.value = event.target.files[0] as File;

    console.log('file picked event:', event)
  }


  async function submit() {
    try {
      await form.value!.validate();
      if (!file.value) {
        throw new Error('Image file has not been selected');
      }
      console.log('UPLOAD OK!!!!!!!!!!!')

      if (props.observation && props.project) {
        await upsertObservationImage(
          props.project?.id,
          props.observation?.id,
          file.value
        )

        console.log('GOT IMAGE UPLOAD RESPONSE:::::::')
        // const json = await res.json();
        // console.log('GOT JSON RESPONSE FROM IMAGE UPLOAD:', json)
      } else {
        throw new Error('Project or observation id was not found')
      }

    } catch(e) {
      // Do nothing as library takes care of errors
      // NOTE: this is to avoid uncaught rejected promises
      return;
    }

    // if (props.project?.id) {
    //   const res = await createObservation(props.project?.id, state.value);
    //   if (runsInElectron()) {
    //     window.electronAPI.observationCreated(res);
    //   } else {
    //     toast.add({
    //       title: 'Observation was saved.'
    //     });
    //   }
    //   navigateTo(`/projects/${props.project.id}`)
    // } else {
    //   throw createError({
    //     statusCode: 500,
    //     statusMessage: 'Project does not exist',
    //   })
    // }
    toast.add({
      title: 'File was uploaded'
    });
  }
</script>