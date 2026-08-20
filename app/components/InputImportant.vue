<template>
  <div class="flex gap-x-2 items-center">
    <div>
      <div v-if="editing">
        <UInput
          v-model="draftValue"
          :placeholder="placeholder || 'Insert value'"
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
        :color="editing ? 'green' : 'gray'"
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
});
const value = computed(() => props.value);
const draftValue = ref<string>("");
const editing = ref(false);
const emit = defineEmits<{ edit: [string] }>();

function toggleEdit() {
  if (!editing.value) {
    editing.value = true;
  } else {
    // saving
    emit("edit", draftValue.value);
    editing.value = false;
  }
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
