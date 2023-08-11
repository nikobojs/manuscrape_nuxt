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
        <div>
          <UButton icon="i-heroicons-plus" variant="outline" color="blue" type="button" @click="addField">
            Add field
          </UButton>
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
  import { FieldOperator, FieldType } from '@prisma/client';

  const { createProject } = await useProjects();
  const loading = ref(false);
  const error = ref('');
  const fieldLabel = ref('');
  const toast = useToast();

  const fieldType = ref(undefined as NewField | undefined);

  const fieldTypes: Record<string, string> = {
    'Text': FieldType.STRING,
    'Date': FieldType.DATE,
    'Whole number': FieldType.INT,
    'Decimal number': FieldType.FLOAT,
  }

  const operators: Record<string, string> = {
    'Difference': FieldOperator.DIFF,
    'Sum': FieldOperator.SUM,
  }

  const fieldTypeOptions = Object.entries(fieldTypes).map(([key, val]) => ({
    label: key,
    type: val,
  }));

  const form = reactive({
    name: '',
    fields: [] as NewField[],
  });

  const addedFields = ref([] as { label: string; field: NewField }[])

  async function handleSubmit() {
    loading.value = true;
    const res = await createProject(
      form.name,
      form.fields,
    ).then(() => {
      error.value = '';
    }).catch(err => {
      error.value = (err?.statusMessage || err?.message).toString();
    }).finally(
      () => loading.value = false
    );
    if (runsInElectron()) {
      window.electronAPI.projectCreated(res);
    } else {
      toast.add({
        title: 'Project was saved.'
      });
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