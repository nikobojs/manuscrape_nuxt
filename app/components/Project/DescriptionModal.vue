<template>
  <UModal
    :open="open"
    @update:open="(value) => { if (!value) emit('close') }"
    :ui="{
      content: 'sm:max-w-lg',
    }"
  >
    <template #content>
    <UCard>
      <template #header>
        <div class="flex justify-between items-center w-full">
          <CardHeader>Project description</CardHeader>
          <UButton
            v-if="isOwner && !isEditing"
            variant="ghost"
            color="neutral"
            icon="i-mdi-pencil-outline"
            class="-mr-2"
            @click="startEditing"
          />
        </div>
      </template>

      <div v-if="!isEditing">
        <p
          v-if="displayDescription"
          class="text-gray-200 whitespace-pre-wrap leading-relaxed"
        >
          {{ displayDescription }}
        </p>
        <div v-else class="flex flex-col items-center gap-2 py-6 text-center">
          <UIcon name="i-mdi-text-box-remove-outline" class="text-3xl text-gray-500" />
          <p class="text-gray-400">This project has no description</p>
        </div>
      </div>

      <div v-else class="flex flex-col gap-3">
        <UTextarea
          v-model="editedDescription"
          placeholder="Enter project description..."
          :rows="6"
          class="w-full"
        />
        <p class="text-xs text-gray-400">
          {{ editedDescription.length }} characters
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <UButton
            v-if="isEditing"
            color="neutral"
            variant="outline"
            @click="cancelEditing"
          >
            Cancel
          </UButton>
          <UButton
            v-if="isEditing"
            color="info"
            :disabled="editedDescription === (project.description || '')"
            @click="saveDescription"
          >
            Save
          </UButton>
          <UButton v-if="!isEditing" color="neutral" variant="outline" @click="emit('close')">
            Close
          </UButton>
        </div>
      </template>
    </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  project: {
    type: Object as PropType<FullProject>,
    required: true,
  },
  isOwner: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits<{
  close: [];
  save: [description: string];
}>();

const isEditing = ref(false);
const editedDescription = ref(props.project.description || "");

const displayDescription = computed(() => {
  return props.project.description?.trim() || "";
});

function startEditing() {
  isEditing.value = true;
  editedDescription.value = props.project.description || "";
}

function cancelEditing() {
  isEditing.value = false;
}

async function saveDescription() {
  emit('save', editedDescription.value);
  isEditing.value = false;
}
</script>
