<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="onClose"
  >
    <UCard>
      <template #header>
        Configure multiple choice
      </template>


      <div class="flex gap-3">
        <UInput
          v-model="itemName"
          type="text"
          placeholder="Enter option value"
          id="password-input"
          required
          ref="itemNameInput"
          @keyup.enter="onAddOption"
        />
        <UButton @click="onAddOption" variant="outline" color="blue">Add option</UButton>
      </div>
      <div class="mt-3 flex gap-2">
        <UBadge color="blue" v-for="item in items" :ui="{ rounded: 'rounded-full' }">
          {{ item }}
        </UBadge>
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end">
          <UButton @click="handleSubmit" variant="outline" color="primary" :disabled="items.length === 0">
            Save field
          </UButton>
          <UButton @click="onClose" color="gray" variant="outline">
            Cancel
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script lang="ts" setup>
  const props = defineProps({
    ...requireModalProps,
    onSubmit: requireFunctionProp<(config: DropDownConfig) => void>(),
  });

  const itemNameInput = ref();
  const items = ref<string[]>([]);
  const itemName = ref('');

  function handleSubmit() {
    props.onSubmit({ choices: items.value });
    props.onClose();

    // delay reset to avoid flickr when data resets while modal close animation runs
    setTimeout(() => {
      items.value = [];
      itemName.value = '';
    }, 300);
  }
  
  function onAddOption() {
    items.value.push(itemName.value);
    itemName.value = '';
    itemNameInput.value?.input?.focus();
  }
</script>