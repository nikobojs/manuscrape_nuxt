<template>
  <h2 class="text-3xl mb-3">Create project</h2>
  <UCard>
  <form @submit.prevent="handleSubmit">

    <div class="flex gap-x-8 items-start">
      <div class="w-80 flex gap-3 flex-col">
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
        <UInput v-model="fieldLabel"  id="field-label-input" placeholder="Enter field label" />
        <USelectMenu v-model="fieldType" :options="fieldTypeOptions" placeholder="Select field type" />
        <div class="grid grid-cols-2 mt-1 w-full">
          <UCheckbox class="items-center" v-model="fieldRequired" label="Field is required" />
          <div class="w-full text-right">
            <UButton icon="i-heroicons-plus" variant="outline" color="blue" type="button" @click="addField">
              Add field
            </UButton>
          </div>
        </div>
      </div>
      <div class="w-96">
        <div v-if="addedFields.length > 0" class="w-full">
          <label class="block mb-2">Fields added to project:</label>
          <div v-for="field in addedFields" class="grid grid-cols-2 gap-x-4 w-full">
            <span class="">{{ field.label }}</span>
            <span class="text-gray-500 text-right">{{ field.field.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <br />
    <br />

    <UButton type="submit" :loading="loading">
      Create project
    </UButton>
    <span v-text="error" class="block mt-3 text-red-600"></span>
  </form>
  </UCard>
  
</template>

<script setup lang="ts">
  const { createProject } = await useProjects();
  const loading = ref(false);
  const error = ref('');
  const fieldLabel = ref('');
  const fieldRequired = ref(false);
  const toast = useToast();

  const fieldType = ref(undefined as NewField | undefined);

  const fieldTypes: Record<string, string> = {
    'Text': 'STRING',
    'Whole number': 'INT',
    'Decimal number': 'FLOAT',
    'Date': 'DATE',
    'Date and time': 'DATETIME',
    'Checkbox': 'BOOLEAN',
  }

  const operators: Record<string, string> = {
    'Difference': 'DIFF',
    'Sum': 'SUM'
  }

  const fieldTypeOptions = Object.entries(fieldTypes).map(([key, val]) => ({
    label: key,
    type: val,
  }));

  const form = reactive({
    name: '',
    fields: [],
  } as NewProjectBody);

  const addedFields = ref([] as { label: string; field: NewField }[])

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
          title: 'Project was saved.'
        });
        navigateTo(`/projects/${res.id}`)
      }
    } catch (err: any) {
      error.value = (err?.statusMessage || err?.message).toString();
    }
  }

  async function addField() {
    if (!fieldType.value) {
      // TODO: error handling
      console.warn('No field type was picked')
      return;
    }

    form.fields.push({
      label: fieldLabel.value,
      type: fieldType.value.type,
      required: fieldRequired.value,
    });

    addedFields.value.push({
      label: fieldLabel.value,
      field: fieldType.value
    })

    fieldLabel.value = '';
    fieldType.value = undefined;
  }

  onMounted(() => {
    error.value = '';
  })
</script>