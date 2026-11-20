<template>
    <UCard class="col-span-2 h-full">
      <template #header>
        <div class="h-4 flex justify-between relative">
          <CardHeader>Tags in project</CardHeader>
          <div class="flex gap-3">
            <UButton
            class="-mt-2 -mb-2"
            variant="outline"
            color="info"
            icon="i-mdi-add"
            @click="openAddTagModal = true"
            >
              Create new
            </UButton>
            <UButton
              class="-mt-2 -mb-2"
              variant="outline"
              color="error"
              icon="i-mdi-add"
              @click="openDeleteTagsModal = true"
            >
              Delete tags
            </UButton>
          </div>
        </div>
      </template>
  
      <div class="flex flex-wrap gap-2 -mt-2 -mb-2">
        <UBadge
          v-for="tag in sortedTags"
          :key="tag.id"
          variant="solid"
          color="neutral"
          class="text-xs px-2 py-1 w-fit text-nowrap"
        >
          #{{ tag.name }}
        </UBadge>
      </div>
    </UCard>
  
    <UModal
      v-model:open="openAddTagModal"
      :ui="{ content: 'sm:max-w-xs max-w-xs' }"
    >
      <template #content>
      <UCard>
        <template #header>
          <div>Create new tag</div>
        </template>
  
        <div class="flex flex-col gap-3">
          <UInput
            v-model="newTagName"
            placeholder="Enter tag name"
          />
          <span class="red text-xs" v-if="newTagError">{{ newTagError }}</span>
        </div>
  
        <template #footer>
          <UButton @click="handleCreateTag" color="info">Create</UButton>
        </template>
      </UCard>
      </template>
    </UModal>

    
  
    <UModal
      v-model:open="openDeleteTagsModal"
    >
      <template #content>
      <UCard>
        <template #header>
          <div>Delete tags by clicking the trash symbol</div>
        </template>
  
        <div class="flex flex-wrap gap-2 -mt-2 -mb-2">
          <UBadge
            v-for="tag in sortedTags"
            :key="tag.id"
            variant="solid"
            color="neutral"
            class="text-sm px-2 py-1 w-fit text-nowrap flex items-center gap-1"
          >
            #{{ tag.name }}
            <UButton
              icon="i-heroicons-trash"
              size="xs"
              color="error"
              variant="link"
              @click="handleDeleteTag(tag.id)"
            />
          </UBadge>
      </div>
  
        <template #footer>
          <UButton @click="()=> openDeleteTagsModal = false " color="info">Done</UButton>
        </template>
      </UCard>
      </template>
    </UModal>
  </template>
  
  <script setup lang="ts">
  const props = defineProps({
    project: requireProjectProp
  });
  
  const { tags, loading, fetchTags, createTag, deleteTag } = useTags(props.project.id);
  onMounted(fetchTags);
  
  const toast = useToast();
  
  const openAddTagModal = ref(false);
  const openDeleteTagsModal = ref(false);
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
        color: 'success',
      });
      newTagName.value = '';
      newTagError.value = '';
      openAddTagModal.value = false;
    } catch (err: any) {
      toast.add({
        title: err.message,
        icon: 'i-heroicons-exclamation-triangle',
        color: 'error',
      });
    }
  }

  async function handleDeleteTag(tagId: number) {
    try {
      const success = await deleteTag(tagId);
        if(success){
          toast.add({
          title: 'Tag deleted!',
          icon: 'i-heroicons-check',
          color: 'success',
        });
      }
    } catch (err: any) {
      toast.add({
        title: err.message,
        icon: 'i-heroicons-exclamation-triangle',
        color: 'error',
      });
    }
  }
  </script>