<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="onClose"
    :ui="{
      width: 'sm:max-w-lg',
    }"
  >
    <UCard>
      <template #header>
        <div class="flex justify-between items-center w-full">
          <CardHeader>Project description</CardHeader>
          <UButton
            v-if="isOwner && !isEditing"
            variant="ghost"
            color="gray"
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
            color="gray"
            variant="outline"
            @click="cancelEditing"
          >
            Cancel
          </UButton>
          <UButton
            v-if="isEditing"
            color="blue"
            :disabled="editedDescription === (project.description || '')"
            @click="saveDescription"
          >
            Save
          </UButton>
          <UButton v-if="!isEditing" color="gray" variant="outline" @click="onClose">
            Close
          </UButton>
        </div>
      </template>
    </UCard>
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
  onClose: {
    type: Function as PropType<() => void>,
    required: true,
  },
  onSave: {
    type: Function as PropType<(description: string) => Promise<void>>,
    required: true,
  },
});

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
  await props.onSave(editedDescription.value);
  isEditing.value = false;
}
</script>
