<template>
    <UCard class="col-span-2 h-full">
      <template #header>
        <div class="h-4 flex justify-between relative">
          <CardHeader>Tags in project</CardHeader>
          <UButton
            class="-mt-2 -mb-2"
            variant="outline"
            color="blue"
            icon="i-mdi-add"
            @click="openAddTagModal = true"
          >
            Add
          </UButton>
        </div>
      </template>
  
      <div class="flex flex-wrap gap-2 -mt-2 -mb-2">
        <UBadge
          v-for="tag in sortedTags"
          :key="tag.id"
          variant="solid"
          color="white"
          class="text-xs px-2 py-1 w-fit text-nowrap"
        >
          {{ tag.name }}
        </UBadge>
      </div>
    </UCard>
  
    <UModal
      v-model="openAddTagModal"
      :ui="{ width: 'sm:max-w-xs max-w-xs' }"
    >
      <UCard>
        <template #header>
          <div>Add new tag</div>
        </template>
  
        <div class="flex flex-col gap-3">
          <UInput
            v-model="newTagName"
            placeholder="Enter tag name"
          />
          <span class="red text-xs" v-if="newTagError">{{ newTagError }}</span>
        </div>
  
        <template #footer>
          <UButton @click="handleCreateTag" color="blue">Create</UButton>
        </template>
      </UCard>
    </UModal>
  </template>
  
  <script setup lang="ts">
  const props = defineProps({
    project: requireProjectProp
  });
  
  const { tags, loading, fetchTags, createTag } = useTags(props.project.id);
  onMounted(fetchTags);
  
  const toast = useToast();
  
  const openAddTagModal = ref(false);
  const newTagName = ref('');
  const newTagError = ref('');
  
  const sortedTags = computed(() =>
    [...tags.value]
      .sort((a, b) => a.name.localeCompare(b.name))
  );
  
  async function handleCreateTag() {
    const name = newTagName.value.trim();
    if (!name) {
      newTagError.value = 'Tag name cannot be empty';
      return;
    }
  
    try {
      await createTag(name);
      toast.add({
        title: 'Tag created!',
        icon: 'i-heroicons-check',
        color: 'green',
      });
      newTagName.value = '';
      newTagError.value = '';
      openAddTagModal.value = false;
    } catch (err: any) {
      toast.add({
        title: err.message,
        icon: 'i-heroicons-exclamation-triangle',
        color: 'red',
      });
    }
  }
  </script>