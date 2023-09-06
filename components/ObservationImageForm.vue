
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
      <NuxtLink
        v-if="observation?.imageId"
        class="text-sm underline text-green-500 cursor-pointer"
        :href="`/projects/${project?.id}/observations/${observation?.id}/edit-image`"
      >
        Edit image
      </NuxtLink>
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
  const { upsertObservationImage, refreshObservations, getObservationById } = await useObservations();
  const file = ref<File | undefined>();
  const uploadChecker = ref();
  const route = useRoute();
  const router = useRouter();
  const uploaded = computed(() => props.observation?.image)
  const uploadInProgress = computed(() => route.query.uploading === '1');
  const timeout = ref<NodeJS.Timeout | null>(null);
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

  async function handleWhenDoneUploading(): Promise<void> {
    if (!props.project?.id) throw new Error('Project is not defined');
    await refreshObservations(props.project.id);
    setTimeout(async () => {
      const done = await checkIfDoneUploading();
      if (done) {
        router.replace({ query: { uploading: 0, electron: route.query.electron || 0 } })
        clearInterval(uploadChecker.value);
        timeout.value !== null && clearTimeout(timeout.value);
        uploadChecker.value = null;
      }
    }, 10);
  }

  // returns whether we are done waiting for an upload in progress
  async function checkIfDoneUploading(): Promise<boolean> {
    if (!props.observation?.id) throw new Error('Observation is not defined');
    const obs = await getObservationById(props.observation.id);

    if (obs?.image?.createdAt) {
      const createdAt = new Date(obs.image.createdAt)
      if (createdAt.getTime() > (pageOpened.value.getTime() - 4500)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  // TODO: improve error handling and implement for ordinary file upload
  onMounted(async () => {
    const alreadyUploaded = await checkIfDoneUploading();
    if (alreadyUploaded) {
      await handleWhenDoneUploading();
    } else if (uploadInProgress.value) {
      // handle timeout on image upload
      timeout.value = setTimeout(() => {
        if (uploadInProgress) {
          toast.add({
            title: 'Uploading takes longer than usual',
            description: 'This could indicate something went wrong :('
          });
        }
      }, 20000);

      // check and handle if image was uploaded
      uploadChecker.value = setInterval(handleWhenDoneUploading, 2000);
    }
  });
</script>