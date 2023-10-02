<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="onClose"
    prevent-close
  >
    <UCard>
      <template #header>
        <CardHeader>Configure multiple choice</CardHeader>
      </template>


      <div class="flex gap-3">
        <UInput
          v-model="itemName"
          type="text"
          placeholder="Enter option label"
          id="password-input"
          required
          ref="itemNameInput"
          @keyup.enter="onAddOption"
        />
        <UButton @click="onAddOption" variant="outline" color="blue">Add option</UButton>
      </div>
      <div class="mt-6 flex gap-3 flex-wrap">
        <!-- added option badges -->
        <UBadge
          color="blue"
          size="lg"
          v-for="item in items"
          :ui="{
            rounded: 'rounded-full'
          }"
          class="hover:dark:bg-blue-300 hover:bg-blue-300 cursor-pointer"
          @click="() => removeOption(item)"
        >
          {{ item }}

          <!-- close icon for each bach -->
          <UIcon
            name="i-mdi-close"
            class="text-lg ml-1 text-gray-800"
          />
        </UBadge>
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end flex-wrap">
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
  const toast = useToast();

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
    if (items.value.includes(itemName.value)) {
      toast.add({
        title: 'There is already an option with that label',
        color: 'yellow'
      });
      itemNameInput.value?.input?.focus();
    } else {
      items.value.push(itemName.value);
      itemName.value = '';
      itemNameInput.value?.input?.focus();
    }
  }

  function removeOption(option: string) {
    console.log('removing option', option)
    items.value = [...items.value.filter((i) => i !== option)];
  }
</script>