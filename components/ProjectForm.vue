<template>
  <h2>Create project</h2>
  <form @submit.prevent="handleSubmit">
    <label for="name-input">
      Name
    </label>
    <input
      v-model="form.name"
      class="input"
      placeholder="Enter project name"
      id="name-input"
      required
    />

    <br />

    <label>
      Fields
    </label>
    <div v-for="field in form.fields" :key="field.label">
      <div>{{ field.label }} ({{ field.type }})</div>
    </div>

    <input placeholder="Enter new field label" v-model="fieldLabel" />
    <select v-model="fieldType">
      <option v-for="fieldKey in Object.keys(fieldTypes)" :key="fieldTypes[fieldKey]" :value="fieldTypes[fieldKey]">{{ fieldKey }}</option>
    </select>
    <input type="button" @click="addField" value="Add field" />

    <br />
    <br />

    <input type="submit" value="Create project" :disabled="loading == true"  />
    <span v-text="error"></span>
  </form>
</template>

<script setup lang="ts">
  const { createProject } = await useProjects();
  const loading = ref(false);
  const error = ref('');
  const fieldLabel = ref('');
  const fieldType = ref('');
  const fieldTypes: Record<string, string> = {
    'Text': 'STRING',
    'Date': 'DATE',
    'Whole number': 'INT',
    'Decimal number': 'FLOAT',
  }

  const form = ref({
    'name': '',
    'fields': [] as ProjectField[],
  });

  async function handleSubmit() {
    loading.value = true;
  
    await createProject(
      form.value.name,
      form.value.fields
    ).catch(err => {
      error.value = (err?.statusMessage || err?.message).toString();
    }).finally(
      () => loading.value = false
    );
  }

  async function addField() {
    form.value.fields.push({
      label: fieldLabel.value,
      type: fieldType.value
    });

    fieldLabel.value = '';
    fieldType.value = '';
  }
</script>