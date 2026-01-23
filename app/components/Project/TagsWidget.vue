<template>
    <UCard class="col-span-2 h-full">
      <template #header>
        <div class="h-4 flex justify-between relative">
          <CardHeader>Tags in project</CardHeader>
          <div class="flex gap-3">
            <UButton
            class="-mt-2 -mb-2"
            variant="outline"
            color="blue"
            icon="i-mdi-add"
            @click="openAddTagModal = true"
            >
              Create new
            </UButton>
            <UButton
              class="-mt-2 -mb-2"
              variant="outline"
              color="red"
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
          color="white"
          class="text-xs px-2 py-1 w-fit text-nowrap"
        >
          #{{ tag.name }}
        </UBadge>
      </div>
    </UCard>
  
    <UModal
      v-model="openAddTagModal"
      :ui="{ width: 'sm:max-w-xs max-w-xs' }"
    >
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
          <UButton @click="handleCreateTag" color="blue">Create</UButton>
        </template>
      </UCard>
    </UModal>

    
  
    <UModal
      v-model="openDeleteTagsModal"
    >
      <UCard>
        <template #header>
          <div>Delete tags by clicking the trash symbol</div>
        </template>
  
        <div class="flex flex-wrap gap-2 -mt-2 -mb-2">
          <UBadge
            v-for="tag in sortedTags"
            :key="tag.id"
            variant="solid"
            color="white"
            class="text-sm px-2 py-1 w-fit text-nowrap flex items-center gap-1"
          >
            #{{ tag.name }}
            <UButton
              icon="i-heroicons-trash"
              size="2xs"
              color="red"
              variant="link"
              @click="handleDeleteTag(tag.id)"
            />
          </UBadge>
      </div>
  
        <template #footer>
          <UButton @click="()=> openDeleteTagsModal = false " color="blue">Done</UButton>
        </template>
      </UCard>
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

  async function handleDeleteTag(tagId: number) {
    try {
      const success = await deleteTag(tagId);
        if(success){
          toast.add({
          title: 'Tag deleted!',
          icon: 'i-heroicons-check',
          color: 'green',
        });
      }
    } catch (err: any) {
      toast.add({
        title: err.message,
        icon: 'i-heroicons-exclamation-triangle',
        color: 'red',
      });
    }
  }
  </script>