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
          @keyup.enter="addOption"
        />
        <UButton @click="addOption" variant="outline" color="blue">Add option</UButton>
      </div>
      <div class="mt-6">
        <!-- added option badges -->
        <draggable
          v-model="options"
          group="picked-items"
          item-key="id"
          @start="drag=true"
          @end="drag=false"
          class="flex gap-2.5 flex-wrap"
        >
          <template #item="{element}">
            <UBadge
              color="blue"
              size="lg"
              :ui="{
                rounded: 'rounded-full'
              }"
              class="hover:dark:bg-blue-300 hover:bg-blue-300 cursor-pointer"
              @click="() => removeOption(element.id)"
            >
              {{ element.name }}

              <!-- close icon for each bach -->
              <UIcon
                name="i-mdi-close"
                class="text-lg ml-1 text-gray-800"
              />
            </UBadge>
          </template>
        </draggable>
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end flex-wrap">
          <UButton @click="handleSubmit" variant="outline" color="primary" :disabled="options.length === 0">
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
  import draggable from 'vuedraggable';

  const props = defineProps({
    ...requireModalProps,
    defaultChoices: requireProp<string[]>(Array),
    onSubmit: requireFunctionProp<(config: DropDownConfig) => void>(),
  });

  const itemNameInput = ref();
  const options = ref<{id: number, name: string}[]>([]);
  const drag = ref(false);
  const itemName = ref('');
  const toast = useToast();

  function handleSubmit() {
    // call props.onSubmit callback with the dropdown names in same order as draggable
    const choices = options.value.map(o => o.name);
    props.onSubmit({ choices });
    props.onClose();

    // delay reset to avoid flickr when data resets while modal close animation runs
    setTimeout(() => {
      options.value = [];
      itemName.value = '';
    }, 300);
  }
  
  function addOption() {
    // get names and ids in seperate arrays
    const names = options.value.map(o => o.name);
    const ids = options.value.map(o => o.id);

    // don't allow duplicate names
    if (names.includes(itemName.value)) {
      toast.add({
        title: 'There is already an option with that label',
        color: 'yellow'
      });
      itemNameInput.value?.input?.focus();
    } else {
      // get the next id
      const id = 1 + Math.max(0, ...ids);

      // push option to the options-value (which is bound to draggable component)
      options.value.push({ id, name: itemName.value });

      // reset name input field and focus
      itemName.value = '';
      itemNameInput.value?.input?.focus();
    }
  }

  // remove option from `options` by id
  function removeOption(id: number) {
    options.value = [...options.value.filter((o) => o.id !== id)];
  }

  // add computed func to listen for changes on `props.open`
  const computedOpen = computed(() => props.open);
  watch([computedOpen], () => {
      // if modal is not open, dont to anything
    if (!props.open) return;

    // warn if there are no default choices
    if (!props.defaultChoices) {
      console.warn('default choices is not defined!', props.defaultChoices)
    } else {
      // set `options` ref value based on `defaultChoices`
      options.value = props.defaultChoices.map((name, id) => ({ id, name }));
    }
  });
</script>