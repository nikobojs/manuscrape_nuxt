<template>
  <div class="flex gap-x-2 items-center">
    <div>
      <div v-if="editing">
        <UInput
          v-model="draftValue"
          :placeholder="placeholder || 'Insert value'"
          @keydown.enter="save"
        />
      </div>
      <div v-else>
        <span>{{ value }}</span>
      </div>
    </div>
    <div>
      <UButton
        variant="ghost"
        class="h-8 w-8 p-1 flex justify-center items-center rounded-full"
        square
        :disabled="disabled"
        :loading="loading"
        :color="editing ? 'success' : 'neutral'"
        @click="toggleEdit"
      >
        <UIcon
          class="text-lg"
          :name="editing ? 'i-mdi-content-save-outline' : 'i-mdi-pencil'"
        />
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  placeholder: String,
  value: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: false,
    default: false,
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
});
const value = computed(() => props.value);
const draftValue = ref<string>("");
const editing = ref(false);
const emit = defineEmits<{ edit: [string] }>();

function toggleEdit() {
  if (!editing.value) {
    editing.value = true;
  } else {
    save();
  }
}

function save() {
  if (!editing.value) return;
  emit("edit", draftValue.value);
  editing.value = false;
}

// when value changes, update draftValue
watch(
  value,
  (v: string) => {
    draftValue.value = v;
  },
  { immediate: true },
);

onMounted(() => (editing.value = false));
</script>
