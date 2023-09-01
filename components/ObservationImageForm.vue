
<template>
  <div v-if="!uploadInProgress">
    <label class="block">
      <UInput class="hidden" type="file" :on:change="onFilePicked" />
      <div class="text-sm">
        <div class="underline text-green-500 cursor-pointer">
          {{ observation?.imageId ? 'Change image' : 'Choose image' }}
        </div>
      </div>
    </label>
    <div v-if="uploaded">
      <div v-if="observation?.imageId" class="text-sm underline text-green-500 cursor-pointer">
        Edit image
      </div>
      <ObservationImageThumbnail
        class="mt-6 mb-4"
        :image="uploaded"
        :observation="observation"
        :project="project"
        :last-update="lastImageUpdate"
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
  });

  const toast = useToast();
  const { upsertObservationImage, refreshObservations } = await useObservations();
  const file = ref<File | undefined>();
  const uploadChecker = ref();
  const route = useRoute();
  const router = useRouter();
  const uploaded = computed(() => props.observation?.image)
  const uploadInProgress = computed(() => route.query.uploading === '1');
  const lastImageUpdate = computed(() => {
    return (
      props?.observation?.image?.createdAt && new Date(props.observation.image.createdAt)
    ) || undefined;
  });

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
      if (!res) {
        return;
      }
    }

    file.value = event.target.files[0] as File;
    try {
      if (props.observation && props.project) {
        await upsertObservationImage(
          props.project.id,
          props.observation.id,
          file.value
        )
        const isFirstImage = !!uploaded.value
        await refreshObservations(props.project.id);
        props.onSubmit?.(isFirstImage);
      } else {
        throw new Error('Project or observation id was not found');
      }
    } catch(err) {
      console.error('Upload image submit error:', err);
      throw err;
    }
  }

  const pageOpened = ref(new Date());

  // TODO: improve error handling and implement for ordinary file upload
  onMounted(() => {
    if (uploadInProgress.value) {
      // handle timeout on image upload
      const timeout = setTimeout(() => {
        if (uploadInProgress) {
          toast.add({
            title: 'Uploading takes longer than usual',
            description: 'This could indicate something went wrong :('
          });
        }
      }, 20000);

      // check and handle if image was uploaded
      uploadChecker.value = setInterval(async () => {
        if (!props.project?.id) throw new Error('Project is not defined');
        await refreshObservations(props.project.id);
        if (props.observation?.image?.createdAt) {
          const createdAt = new Date(props.observation.image.createdAt)
          if (createdAt.getTime() > (pageOpened.value.getTime() - 3000)) {
            router.replace({ query: { uploading: 0, electron: route.query.electron || 0 } })
            clearInterval(uploadChecker.value);
            clearTimeout(timeout);
            uploadChecker.value = null;
          }
        }
      }, 2000);
    }
  });
</script>