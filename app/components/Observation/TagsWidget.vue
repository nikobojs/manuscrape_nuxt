<template>
  <UCard class="col-span-2 h-full">
    <template #header>
      <div class="h-4 flex justify-between relative">
        <CardHeader>Tags</CardHeader>
        <UButton
          class="-mt-2 -mb-2"
          variant="outline"
          color="blue"
          icon="i-mdi-add"
          @click="openCreateNewTagModal = true"
        >
          Create new
        </UButton>
      </div>
    </template>
    <div
      class="text-[#75809f] min-h-[40px] -mt-6 flex items-center text-sm italic"
    >
      Click tags to add or remove
    </div>
    <div class="flex flex-wrap gap-2">
      <UBadge
        v-for="tag in sortedTags"
        :key="tag.id"
        :color="isTagSelected(tag.id) ? 'blue' : 'gray'"
        variant="solid"
        class="text-xs px-2 py-1 cursor-pointer"
        @click="toggleTag(tag.id)"
      >
        #{{ tag.name }}
      </UBadge>
    </div>
  </UCard>

  <UModal
    v-model="openCreateNewTagModal"
    :ui="{ width: 'sm:max-w-xs max-w-xs' }"
  >
    <UCard>
      <template #header>
        <div>Create new tag</div>
      </template>

      <div class="flex flex-col gap-3">
        <UInput v-model="newTagName" placeholder="Enter tag name" />
        <span class="text-red-500 text-xs" v-if="newTagError">{{
          newTagError
        }}</span>
      </div>

      <template #footer>
        <UButton @click="handleCreateTag" color="blue">Create</UButton>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
  project: requireProjectProp,
  observationId: {
    type: Number,
    required: true,
  },
  tagsOnObservation: {
    type: Array as PropType<{ id: number; name: string }[]>,
    required: true,
  },
});

console.log("tags on observation:", props.tagsOnObservation);

const toast = useToast();
const openCreateNewTagModal = ref(false);
const newTagName = ref("");
const newTagError = ref("");

const selectedTagIds = ref(new Set(props.tagsOnObservation.map((t) => t.id)));

watch(
  () => props.tagsOnObservation,
  (newTags) => {
    selectedTagIds.value = new Set(newTags.map((t) => t.id));
  },
  { immediate: true },
);

const {
  tags,
  fetchTags,
  createTag,
  attachTagToObservation,
  detachTagFromObservation,
} = useTags(props.project.id);

const { refreshObservations } = await useObservations(props.project.id);

onMounted(fetchTags);

const sortedTags = computed(() =>
  [...tags.value].sort((a, b) => a.name.localeCompare(b.name)),
);

const isTagSelected = (tagId: number) => selectedTagIds.value.has(tagId);

async function toggleTag(tagId: number) {
  try {
    if (!props.observationId) return;

    if (isTagSelected(tagId)) {
      await detachTagFromObservation(tagId, props.observationId);
      selectedTagIds.value.delete(tagId);
    } else {
      await attachTagToObservation(tagId, props.observationId);
      selectedTagIds.value.add(tagId);
    }
  } catch (err: any) {
    toast.add({
      title: err.message,
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  }
}

async function handleCreateTag() {
  const name = newTagName.value.trim();
  if (!name) {
    newTagError.value = "Tag name cannot be empty";
    return;
  }

  try {
    await createTag(name, props.observationId);
    toast.add({
      title: "Tag created!",
      icon: "i-heroicons-check",
      color: "green",
    });
    newTagName.value = "";
    newTagError.value = "";
    openCreateNewTagModal.value = false;
    await fetchTags();
    await refreshObservations();
  } catch (err: any) {
    toast.add({
      title: err.message,
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
    });
  }
}
</script>
