<template>
  <div>
    <div class="grid grid-cols-3 gap-6">
      <div v-for="image in images" class="relative">
        <ObservationImageThumbnail
          :image="image"
          :observation="observation"
          :project="project"
          :last-update="new Date(image.createdAt)"
          class="w-full"
        />
        <div class="absolute top-1.5 right-1.5">
          <UButton
            square
            class="rounded-full bg-slate-900 transition-all opacity-80 hover:opacity-100 hover:border-slate-400 border border-transparent"
            variant="soft"
            size="xs"
            color="gray"
            @click="() => emit('remove', image.id)"
          >
            <UIcon name="i-mdi-close" />
          </UButton>
        </div>
      </div>
      <label class="mb-3 block" v-if="multiple || images.length === 0">
        <UInput
          ref="fileInput"
          class="hidden"
          type="file"
          accept="image/png, image/jpeg"
          :on:change="
            (event: Event) => {
              if (multiple) {
                emit('add', event);
              } else {
                emit('change', event);
              }
            }
          "
        />
        <div class="h-40">
          <div
            class="w-full h-full transition-all text-primary-500 dark:text-primary-500 bg-slate-900/50 dark:bg-slate-900/50 hover:bg-slate-800 dark:hover:bg-slate-800 disabled:bg-slate-600 aria-disabled:bg-slate-500 dark:disabled:bg-slate-400 dark:aria-disabled:bg-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 dark:focus-visible:outline-slate-400 ring-0 border-primary-500/30 border border-dashed rounded-lg flex items-center justify-center cursor-pointer"
          >
            <div
              class="h-20 w-20 flex justify-center items-center bg-green-900/20 rounded-full"
            >
              <UIcon
                name="i-mdi-upload-outline"
                class="text-primary-400 text-4xl"
              />
            </div>
          </div>
        </div>
      </label>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  multiple: {
    required: false,
    type: Boolean,
  },
  required: {
    required: true,
    type: Boolean,
  },
  removable: {
    required: true,
    type: Boolean,
  },
  images: {
    required: true,
    type: Array as PropType<ImageUpload[]>,
  },
  observation: requireObservationProp,
  project: requireProjectProp,
});

const emit = defineEmits<{
  change: [Event];
  add: [Event];
  remove: [number];
}>();
</script>
