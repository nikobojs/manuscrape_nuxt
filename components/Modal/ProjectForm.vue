<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="onClose"
    :ui="{background: 'transparent', width: 'sm:max-w-xl lg:max-w-2xl xl:max-w-4xl', shadow: 'shadow-none'}"
    prevent-close
  >
    <div class="flex gap-x-6 gap-y-6 bg-transparent justify-around">
      <UCard class="overflow-hidden w-96 shadow-xl">
        <template #header>
          <CardHeader>Create project</CardHeader>
        </template>

        <form
          class="flex gap-3 flex-col"
          @submit.prevent="handleSubmit"
        >
          <label for="name-input">
            Name:
          </label>
          <UInput
            v-model="form.name"
            placeholder="Enter project name"
            id="name-input"
            required
          />
            <label class="mt-5" for="field-label-input">
              Parameters
              <UTooltip :ui="{base: 'p-2 text-xs'}">
                <template #text>
                  When adding observations later on, all the
                  parameters will need to be set manually for each observation.
                </template>
                <UIcon name="i-heroicons-information-circle" />
              </UTooltip>
            </label>
          <UInput v-model="fieldLabel" ref="fieldLabelInput" id="field-label-input" placeholder="Enter label" />

          <div>
            <USelectMenu
              v-model="fieldType"
              :options="fieldTypeOptions"
              placeholder="Select type"
            />
            <div class="grid grid-cols-2 mt-3 w-full">
              <div class="items-center inline-flex">
                <UCheckbox v-model="fieldRequired" :disabled="forceFieldRequired" label="Required?" />
              </div>
              <div class="w-full text-right">
                <UButton
                  icon="i-heroicons-plus"
                  variant="outline"
                  color="blue"
                  type="button"
                  @click="addField"
                  :disabled="!newFieldIsValid"
                >
                  Add field
                </UButton>
              </div>
            </div>
          </div>

          <div class="mt-6 flex gap-x-3 justify-end">
            <UButton @click="onClose" color="gray" variant="outline">
              Cancel
            </UButton>
            <UButton type="submit" :loading="loading" :disabled="!newProjectIsValid">
              Create project
            </UButton>
          </div>
          <span v-text="error" v-if="error" class="block mt-3 text-red-600"></span>
        </form>
      </UCard>
      <UCard class="overflow-hidden shadow-xl" v-if="addedFields.length > 0">
        <template #header>
          <CardHeader>Parameters</CardHeader>
        </template>
        <div v-if="addedFields.length > 0" class="w-full border border-gray-700 rounded-md bg-slate-950 p-3">
          <div class="grid grid-cols-12 gap-x-4 w-full border-b border-b-gray-800 pb-2 mb-2">
            <span class="text-gray-500 text-xs col-span-7">Label</span>
            <span class="text-gray-500 text-right text-xs col-span-3">Type</span>
            <span class="text-gray-500 text-right text-xs col-span-2">Required?</span>
          </div>
          <div v-for="field in addedFields" class="grid grid-cols-12 gap-x-4 w-full">
            <!-- Create generic field group -->
            <span class="whitespace-nowrap overflow-hidden text-ellipsis col-span-7 max-w-sm">{{ field.label }}</span>
            <span class="text-gray-500 text-right text-xs col-span-3">{{ field.field.label }}</span>
            <span class="text-gray-500 text-right text-xs col-span-2">{{ field.required ? 'Yes' : 'No' }}</span>
          </div>
        </div>
      </UCard>
    </div>
  </UModal>

  <ModalAddDropdownField
    :open="openDropdownModal"
    :onSubmit="addDropdownField"
    :onClose="() => openDropdownModal = false"
  />
</template>

<script setup lang="ts">
  const props = defineProps({
    ...requireModalProps,
  });

  import { ObservationFieldTypes } from '~/utils/observationFields';

  const { createProject } = await useProjects();
  const toast = useToast();

  const loading = ref(false);
  const error = ref('');
  const fieldLabel = ref('');
  const fieldRequired = ref(false);
  const fieldLabelInput = ref();
  const openDropdownModal = ref(false);
  const fieldType = ref(undefined as NewField | undefined);
  const form = reactive<NewProjectBody>({
    name: '',
    fields: [],
  });

  const newFieldIsValid = computed<boolean>(() =>
    fieldLabel.value.length > 0 && !!fieldType.value
  );
  const newProjectIsValid = computed<boolean>(() =>
    form.name.length > 0 && form.fields.length > 0
  );
  const forceFieldRequired = computed<boolean>(() => {
    if (
      fieldType.value &&
      ['BOOLEAN'].includes(fieldType.value?.type)
    ) {
      fieldRequired.value = true;
      return true;
    } else {
      fieldRequired.value = false;
      return false;
    }
  });

  const fieldTypeOptions = Object.entries(
    ObservationFieldTypes
  ).map(([key, val]) => ({
    label: key,
    type: val,
  }));

  const addedFields = ref([] as { label: string; field: NewField, required: boolean }[])

  async function handleSubmit() {
    loading.value = true;
    try {
      const res = await createProject(
        form.name,
        form.fields,
      );

      error.value = '';
      loading.value = false;

      if (!res?.id) {
        console.error(`Unable to read 'id' from createProject api response`);
        toast.add({
          title: 'Server error :(',
          description: `We're working to fix this as soon as possible`
        });
        // TODO: capture error
      }

      if (runsInElectron()) {
        window.electronAPI.projectCreated(res);
      } else {
        toast.add({
          title: 'Project was created successfully.'
        });
        props.onClose();
        setTimeout(() => {
          form.name = '';
          form.fields = [];
        }, 300);
      }
    } catch (err: any) {
      error.value = (err?.statusMessage || err?.message).toString();
    }
  }

  function addDropdownField({ choices }: DropDownConfig) {
    if (!fieldType.value) {
      // TODO: error handling
      console.warn('No field type was picked')
      return;
    }

    if (!['CHOICE', 'AUTOCOMPLETE'].includes(fieldType.value.type)) {
      // TODO: report error
      throw new Error(`Dropdown field type '${fieldType.value.type}' is not supported`);
    }
    
    form.fields.push({
      label: fieldLabel.value,
      type: fieldType.value.type,
      required: fieldRequired.value,
      choices: choices,
    });

    addedFields.value.push({
      label: fieldLabel.value,
      field: fieldType.value,
      required: fieldRequired.value,
    })

    fieldLabel.value = '';
    fieldType.value = undefined;
  }

  async function addField() {
    if (!fieldType.value) {
      // TODO: error handling
      console.warn('No field type was picked')
      return;
    }

    if (['CHOICE', 'AUTOCOMPLETE'].includes(fieldType.value.type)) {
      openDropdownModal.value = true;
      return;
    }

    if (form.fields.find((f) => f.label === fieldLabel.value)) {
      error.value = 'Two fields cannot have the same label';
      return;
    }

    form.fields.push({
      label: fieldLabel.value,
      type: fieldType.value.type,
      required: fieldRequired.value,
    });

    addedFields.value.push({
      label: fieldLabel.value,
      field: fieldType.value,
      required: fieldRequired.value,
    })

    fieldLabel.value = '';
    fieldType.value = undefined;
    error.value = '';
    fieldLabelInput.value?.input?.focus?.();
  }

  onMounted(() => {
    error.value = '';
  });
</script>