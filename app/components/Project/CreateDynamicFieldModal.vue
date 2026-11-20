<template>
  <UModal
    :open="open"
    @update:open="(value) => { if (!value) handleClose() }"
  >
    <template #content>
    <UCard>
      <template #header>
        <CardHeader>Create dynamic field</CardHeader>
      </template>
      <div class="relative z-50">
        <UForm :validate="validate" :state="state" @submit="submit">
          <div class="grid grid-cols-2 gap-x-3 mb-3">
            <UFormField name="label" label="Label">
              <UInput placeholder="Enter field label" v-model="state.label" required />
            </UFormField>
            <UFormField name="operator" label="Operation">
              <USelect
                required
                v-model="state.operator"
                value-key="value"
                label-key="label"
                :items="Object.values(operators)" />
            </UFormField>
          </div>
          <div class="grid grid-cols-2 gap-x-3 mb-3">
            <UFormField name="field0Id" label="Field 1" class="mb-3">
              <ProjectFieldDropdown
                :fields="project.fields"
                v-model:selectedFieldId="state.field0Id" />
            </UFormField>
            <UFormField name="field1Id" label="Field 2">
              <ProjectFieldDropdown
                :fields="project.fields"
                v-model:selectedFieldId="state.field1Id" />
            </UFormField>
          </div>
        </UForm>
        <span class="text-red-500" v-if="error">{{ error }}</span>
      </div>
      <template #footer>
        <div class="flex gap-3 justify-end flex-wrap">
          <UButton @click="submit" variant="outline" color="primary"> Save </UButton>
          <UButton @click="handleClose" color="neutral" variant="outline"> Cancel </UButton>
        </div>
      </template>
    </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FormError } from '#ui/types';

const props = defineProps({
  project: requireProjectProp,
  ...requireModalProps,
});

const emit = defineEmits<{
  close: [];
}>();

const resetState = () => {
  Object.assign(state, initialState);
};

const handleClose = () => {
  error.value = null;
  resetState();
  emit('close');
};

const { createDynamicField, operators } = await useDynamicFields(props.project.id);
const error = ref<FormError | null>(null);

const initialState = {
  field0Id: undefined as number | undefined,
  field1Id: undefined as number | undefined,
  operator: (operators[0]?.value ?? '') as string,
  label: '',
};

const state = reactive({
  ...initialState,
});

async function validate(state: any) {
  const errors = [] as FormError[];
  // TODO: make sure all fields are set
  // TODO: ensure referenced static fields are required
  // TODO: make sure fields are not the same
  // TODO: make sure dynamic field label is not used before

  if (typeof state.field0Id !== 'number') {
    errors.push({ message: 'Select a field',  name: 'field0Id' });
  }
  if (typeof state.field1Id !== 'number') {
    errors.push({ message: 'Select a field',  name: 'field1Id' });
  }
  if (state.label.length === 0) {
    errors.push({ message: 'Needs to be at least 1 character',  name: 'label' });
  }

  return errors;
}

async function submit() {
  try {
    await createDynamicField(props.project.id, state as any);
    handleClose();
  } catch (e: any) {
    error.value = getErrMsg(e);
  }
}
</script>
