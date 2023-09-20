
<template>
  <div v-if="!uploadInProgress">
    <label class="block" v-if="!$props.disabled">
      <UInput class="hidden" type="file" accept="image/png, image/jpeg"  :on:change="onFilePicked" />
      <div class="text-sm">
        <div v-if="!$props.disabled" class="underline text-green-500 cursor-pointer">
          {{ observation?.imageId ? 'Change image' : 'Choose image' }}
        </div>
      </div>
    </label>
    <div v-if="uploaded">
      <NuxtLink
        v-if="observation?.imageId && !$props.disabled"
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
import { formatMb } from '~/utils/formatMb';

  const props = defineProps({
    observation: requireObservationProp,
    project: requireProjectProp,
    onSubmit: Function as PropType<(isFirstImage: boolean) => Promise<void>>,
    disabled: Boolean as PropType<boolean>,
    imageUploaded: Boolean as PropType<boolean>,
    uploadInProgress: Boolean as PropType<boolean>,
  });

  if (!props.project?.id) {
    throw new Error('Project id is not defined')
  }

  const toast = useToast();
  const { upsertObservationImage } = await useObservations(props.project.id);
  const file = ref<File | undefined>();
  const uploadChecker = ref();
  const route = useRoute();
  const router = useRouter();
  const uploaded = computed(() => props.observation?.image?.id && props.observation.image)
  const timeout = ref<null | number>(null);
  const config = useRuntimeConfig().public;
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

    // ensure size is ok
    if (files[0].size > config.maxImageSize) {
      toast.add({
        title: 'Image file is too big',
        description: 'Maximum size allowed is ' + formatMb(config.maxImageSize),
        icon: 'i-heroicons-exclamation-triangle',
        color: 'red'
      });
      return;
    }

    // ensure overwriting of image is confirmed by user
    if (props.observation?.image) {
      // TODO: create nice confirm box
      const res = confirm('Are you sure you want to overwrite the existing image?');
      if (!res) {
        return;
      }
    }

    file.value = files[0] as File;

    try {
      await upsertObservationImage(
        props.project.id,
        props.observation.id,
        file.value
      ).then(async () => {
        if (typeof props.project?.id !== 'number') {
          throw new Error('Project id is not found')
        }
        const isFirstImage = !!uploaded.value
        props.onSubmit?.(isFirstImage);
      }).catch((e: any) => {
        let msg = 'An error occured when uploading image'
        if (e.message) {
          msg = e.message;
        }
        toast.add({
          title: 'Image upload error',
          description: msg,
          icon: 'i-heroicons-exclamation-triangle',
          color: 'red'
        });
      })
    } catch(err) {
      console.error('Upload image submit error:', err);
      throw err;
    }
  }

  // TODO: document better
  async function handleIfUploadDone(): Promise<void> {
    if (!props.uploadInProgress) {
      setTimeout(async () => {
        router.replace({ query: { electron: route.query.electron || 0 } })
        window.clearInterval(uploadChecker.value);
        timeout.value !== null && clearTimeout(timeout.value);
        uploadChecker.value = null;
      }, 10);
    }
  }

  // TODO: improve error handling and implement for ordinary file upload
  onBeforeMount(async () => {
    if (props.imageUploaded) {
      await handleIfUploadDone();
    } else if (props.uploadInProgress) {
      // handle timeout on image upload
      timeout.value = window.setTimeout(() => {
        if (props.uploadInProgress) {
          toast.add({
            title: 'Uploading takes longer than usual',
            description: 'This could indicate something went wrong. Try to refresh the page.'
          });
          uploadChecker.value && window.clearInterval(uploadChecker.value)
          uploadChecker.value = null;
        }
      }, 20000);

      // check and handle if image was uploaded
      uploadChecker.value = window.setInterval(handleIfUploadDone, 2000);
    }
  });
</script>