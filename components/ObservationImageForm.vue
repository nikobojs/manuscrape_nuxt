
<template>
  <div v-if="!uploadInProgress">
    <label class="block">
      <UInput class="hidden" type="file" :on:change="onFilePicked" />
      <div class="text-sm" v-if="!file">
        <div class="underline text-green-500 cursor-pointer">
          {{ observation?.imageId ? 'Change image' : 'Choose image' }}
        </div>
      </div>
    </label>
    <div v-if="!file && uploaded">
      <div>Existing image:</div>
      <ObservationImage" :image="uploaded" />
    </div>
    <div v-if="file">
      <div>Edit image:</div>
      <ObservationCanvas
        :image="file"
        :on-save="() => onImageSaved(!uploaded)"
      />
    </div>
  </div>
  <div v-else class="flex gap-x-1 items-center">
    <Spinner />
    Processing image...
  </div>
</template>

<script lang="ts" setup>
  const props = defineProps({
    project: Object as PropType<FullProject>,
    observation: Object as PropType<FullObservation>,
    onSubmit: Function as PropType<(isFirstImage: boolean) => Promise<void>>,
    uploadInProgress: Boolean as PropType<Boolean>,
  });

  const toast = useToast();

  const file = ref<File | undefined>();
  const uploaded = computed(() => props.observation?.image.id)

  async function onImageSaved(isFirstImage: boolean) {
    props?.onSubmit?.(isFirstImage);
  }

  async function onFilePicked(event: any) {
    const files = event?.target?.files || [];
    if (files.length == 0) {
      return;
    } else if (files.length > 1) {
      throw new Error('Only one file can be uploaded at a time')
    }

    if (props.observation?.image) {
      // TODO: create nice confirm box
      const res = confirm('Are you sure you want to overwrite the existing image?');
      console.log({ res })
      if (!res) {
        return;
      }
    }

    file.value = event.target.files[0] as File;
  }

  // handle timeout on image upload
  // TODO: improve error handling and implement for ordinary file upload
  onMounted(() => {
    if (props.uploadInProgress) {
      setTimeout(() => {
        if (props.uploadInProgress) {
          toast.add({
            title: 'Uploading takes longer than usual',
            description: 'This could indicate something went wrong :('
          });
        }
      }, 20000);
    }
  })
</script>