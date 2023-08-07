<template>
  <h2 class="text-3xl mb-3">Create project</h2>
  <UCard>
  <form @submit.prevent="handleSubmit">

    <div class="flex gap-x-8 items-start">
      <div class="w-80 flex gap-3 flex-col">
        <label for="name-input">
          Name
        </label>
        <UInput
          v-model="form.name"
          placeholder="Enter project name"
          id="name-input"
          required
        />
        <label class="mt-5" for="field-label-input">
          Add fields
        </label>
        <UInput v-model="fieldLabel"  id="field-label-input" placeholder="Enter field label" />
        <USelectMenu v-model="fieldType" :options="Object.keys(fieldTypes)" placeholder="Select field type" />
        <div>
          <UButton icon="i-heroicons-plus" variant="outline" color="blue" type="button" @click="addField">
            Add field
          </UButton>
        </div>
      </div>
      <div>
        <UTable
          :rows="form.fields"
          :columns="fieldColumns"
        >
          <template #label-header>
            <span>Added fields</span>
          </template>
          <template #type-header>
            <span></span>
          </template>
          <template #label-data="{ row }">
            <span>{{  row.label  }}</span>
          </template>
          <template #type-data="{ row }">
            <span>{{  row.type  }}</span>
          </template>
          <template #empty-state>
            <span class="text-gray-500 mt-3 block">
              No fields added
            </span>
          </template>
        </UTable>
      </div>
    </div>

    <br />
    <br />

    <UButton type="submit" :loading="loading">
      Create project
    </UButton>
    <span v-text="error"></span>
  </form>
  </UCard>
  
</template>

<script setup lang="ts">
  const { createProject } = await useProjects();
  const loading = ref(false);
  const error = ref('');
  const fieldLabel = ref('');
  const fieldColumns = [
    { key: 'label', label: 'Label', class: "py-2 text-red" },
    { key: 'type', label: 'Type', class: "py-2" }
  ];

  const fieldType = ref('');

  const fieldTypes: Record<string, string> = {
    'Text': 'STRING',
    'Date': 'DATE',
    'Whole number': 'INT',
    'Decimal number': 'FLOAT',
  }

  const form = reactive({
    'name': '',
    'fields': [] as ProjectField[],
  });

  async function handleSubmit() {
    loading.value = true;
  
    await createProject(
      form.name,
      form.fields.map((f) => ({ ...f, type: fieldTypes[f.type]}))
    ).catch(err => {
      error.value = (err?.statusMessage || err?.message).toString();
    }).finally(
      () => loading.value = false
    );
  }

  async function addField() {
    form.fields.push({
      label: fieldLabel.value,
      type: fieldType.value
    });

    fieldLabel.value = '';
    fieldType.value = '';
  }
</script>