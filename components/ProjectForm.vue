<template>
  <h2 class="text-3xl mb-3">Create project</h2>
  <UCard class="overflow-visible">
    <form @submit.prevent="handleSubmit">

      <div class="flex gap-x-8">
        <div class="w-3/12 flex gap-3 flex-col border-r border-r-slate-800 -my-6 py-6 pr-6">
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
            Observation fields:
          </label>
          <UInput v-model="fieldLabel" ref="fieldLabelInput" id="field-label-input" placeholder="Enter field label" />
          <USelectMenu v-model="fieldType" :options="fieldTypeOptions" placeholder="Select field type" />
          <div class="grid grid-cols-2 mt-1 w-full">
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

          <div class="mt-6">
            <UButton type="submit" :loading="loading" :disabled="!newProjectIsValid">
              Create project
            </UButton>
          </div>
          <span v-text="error" class="block mt-3 text-red-600"></span>
        </div>
        <div class="w-9/12">
          <label class="block mb-4">Fields added so far:</label>
          <div v-if="addedFields.length > 0" class="w-full border border-gray-700 rounded-md bg-slate-950 p-3">
            <div class="grid grid-cols-5 gap-x-4 w-full border-b border-b-gray-800 pb-2 mb-2">
              <span class="text-gray-500 text-xs col-span-3">Label</span>
              <span class="text-gray-500 text-right text-xs">Type</span>
              <span class="text-gray-500 text-right text-xs">Required?</span>
            </div>
            <div v-for="field in addedFields" class="grid grid-cols-5 gap-x-4 w-full">
              <span class="whitespace-nowrap overflow-hidden text-ellipsis col-span-3">{{ field.label }}</span>
              <span class="text-gray-500 text-right">{{ field.field.label }}</span>
              <span class="text-gray-500 text-right">{{ field.required ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </div>
      </div>
    </form>

    <ModalAddDropdownField
      :open="openDropdownModal"
      :onSubmit="addDropdownField"
      :onClose="() => openDropdownModal = false"
    />
  </UCard>
</template>

<script setup lang="ts">
  const props = defineProps({
    onNewProjectCreated: requireFunctionProp<(projectId: number) => void>(),
  });

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

  const fieldTypes: Record<string, string> = {
    'Text': 'STRING',
    'Whole number': 'INT',
    'Decimal number': 'FLOAT',
    'Date': 'DATE',
    'Date and time': 'DATETIME',
    'Checkbox': 'BOOLEAN',
    'Radio buttons': 'CHOICE',
    'Dropdown': 'AUTOCOMPLETE',
  }

  const operators: Record<string, string> = {
    'Difference': 'DIFF',
    'Sum': 'SUM'
  }

  const fieldTypeOptions = Object.entries(fieldTypes).map(([key, val]) => ({
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
        props.onNewProjectCreated(res.id);
        toast.add({
          title: 'Project was created successfully.'
        });
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
    
    console.log('adding dropdown field:', {
      label: fieldLabel.value,
      type: fieldType.value,
      required: fieldRequired.value,
      choices: choices,
    })

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
    fieldLabelInput.value?.input?.focus?.();
  }

  onMounted(() => {
    error.value = '';
  })
</script>