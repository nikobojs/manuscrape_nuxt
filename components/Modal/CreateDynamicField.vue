<template>
    <UModal
      v-bind:model-value="open"
      v-on:close="onClose"
    >
      <UCard>
        <template #header>
          Create dynamic field
        </template>
        <div>
          <UForm ref="form" :validate="validate" :state="state" @submit.prevent="submit">
            <div class="grid grid-cols-2 gap-x-3 mb-3">
              <UFormGroup name="label" label="Label">
                <UInput placeholder="Enter field label" v-model="state.label" required />
              </UFormGroup>
              <UFormGroup name="operator" label="Operation">
                <USelect value-attribute="value" required option-attribute="label" :options="Object.values(operators)" v-model="state.operator" />
              </UFormGroup>
            </div>
            <div class="grid grid-cols-2 gap-x-3 mb-3">
              <UFormGroup name="field0Id" label="Field 1" class="mb-3">
                <FieldDropdown :fields="project.fields" v-model="state.field0Id" />
              </UFormGroup>
              <UFormGroup name="field1Id" label="Field 2">
                <FieldDropdown :fields="project.fields" v-model="state.field1Id" />
              </UFormGroup>
            </div>
          </UForm>
          <span class="text-red-500" v-if="error">{{  error }}</span>
        </div>
        <template #footer>
          <div class="flex gap-3 justify-end flex-wrap">
            <UButton @click="submit" variant="outline" color="primary">
              Save
            </UButton>
            <UButton @click="onClose" color="gray" variant="outline">
              Cancel
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
</template>

<script setup lang="ts">
  import type { FormError } from '@nuxthq/ui/dist/runtime/types/form';

  const { createDynamicField } = await useProjects();

  const props = defineProps({
    project: requireProjectProp,
    ...requireModalProps,
  });

  const form = ref();
  const error = ref();

  const operators = [
    {
      label: 'Difference',
      value: 'DIFF'
    },
    {
      label: 'Sum',
      value: 'SUM'
    },
  ]

  const state = reactive({
    field0Id: undefined as (number | undefined),
    field1Id: undefined as (number | undefined),
    operator: undefined as (string | undefined),
    label: '',
  });


  watch([state], () => { console.log({ ...state }) }, { deep: true })

  async function validate(state: any) {
    const errors = [] as FormError[];
    // TODO: make sure all fields are set
    // TODO: ensure referenced static fields are required
    // TODO: make sure fields are not the same
    // TODO: make sure dynamic field label is not used before

    if (typeof state.field0Id !== 'number') {
      errors.push({ message: 'Select a field', path: 'field0Id' });
    }
    if (typeof state.field1Id !== 'number') {
      errors.push({ message: 'Select a field', path: 'field1Id' });
    }
    if (state.label.length === 0) {
      errors.push({ message: 'Needs to be at least 1 character', path: 'label' });
    }

    console.log('validating state', { ...state })
    return errors;
  }

  async function submit() {
    try {
      await form.value!.validate();
    } catch(e) {
      console.error(e)
      // Do nothing as library takes care of errors
      // NOTE: this is to avoid uncaught rejected promises
      return;
    }

    try {
      await createDynamicField(props.project.id, state as any);
      props.onClose();
    } catch(e: any) {
      error.value = getErrMsg(e);
    }
  }
</script>