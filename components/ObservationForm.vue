
<template>
  <UForm ref="form" :validate="validate" :state="state" @submit.prevent="submit">
    <div v-for="({ props, element, field }) in inputs" class="mb-4">
      <UFormGroup :name="field.label" :label="field.label">
        <component :is="element" v-model="state[field.label]" v-bind="props" :disabled="!!$props.disabled" />
      </UFormGroup>
    </div>
    <UButton
      v-if="!props.disabled"
      variant="outline"
      class="mt-4"
      type="submit"
      :disabled="!!$props.disabled"
    >
      Save metadata
    </UButton>
  </UForm>
</template>

<script lang="ts" setup>
  import type { FormError } from '@nuxthq/ui/dist/runtime/types/form';
  import type UInput from '@nuxthq/ui/dist/runtime/components/forms/Input.vue';
  import type UCheckbox from '@nuxthq/ui/dist/runtime/components/forms/Input.vue';
import { t } from 'vitest/dist/types-198fd1d9';

  const form = ref();
  const inputs = ref([] as CMSInput[]);
  const toast = useToast();
  const props = defineProps({
    project: Object as PropType<FullProject>,
    observation: Object as PropType<FullObservation>,
    onSubmit: Function as PropType<Function>,
    disabled: Boolean as PropType<Boolean>,
  });

  if (!props.observation?.id || !props.project?.id) {
    throw new Error('Project id or observation id is not defined in url params')
  }

  await useProjects();
  const { patchObservation } = await useObservations(props.project.id);

  enum FieldType {
    DATE = 'DATE',
    STRING = 'STRING',
    INT = 'INT',
    FLOAT = 'FLOAT',
    DATETIME = 'DATETIME',
    BOOLEAN = 'BOOLEAN',
  };

  const inputTypes: Record<string, string> = Object.freeze({
    [FieldType.DATE]: 'date',
    [FieldType.STRING]: 'text',
    [FieldType.INT]: 'number',
    [FieldType.FLOAT]: 'number',
    [FieldType.DATETIME]: 'datetime-local',
  });

  if (!props.observation || !props.project) {
    toast.add({
      title: props.observation ? 'Observation does not exist' : 'Project does not exist',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    });
    navigateTo('/');
  } else {
    if (inputs.value.length == 0) {
      buildForm(props.project);
    }
  }

  const state = ref(props.observation?.data as any);

  function validate(state: any): FormError[] {
    if (!props.project) {
      throw createError({
        statusMessage: 'Project does not exist',
        statusCode: 400,
      });
    }
    if (!props.observation) {
      throw createError({
        statusMessage: 'Observation does not exist',
        statusCode: 400,
      });
    }

    const errors = [] as FormError[];

    // scan for missing fields
    const missingFields = props.project.fields.filter(f => {
      return (
        f.required &&
        !Object.keys(state).includes(f.label) && 
        f.type !== FieldType.BOOLEAN
      );
    });

    if (missingFields.length > 0) {
      for(const field of missingFields) {
        errors.push({ path: field.label, message: 'Field is required'});
      }
    }
  
    // validate each state value
    for (const [key, value] of Object.entries(state)) {
      // validate field (field)
      const field = props.project.fields.find((field) => field.label == key)
      if (!field) {
        throw createError({
          statusCode: 500,
          statusMessage: `Field '${key}' does not exist :(`
        });
      }

      // check if field is required or optional
      if (field.required && (value === null || value === undefined)) {
        errors.push({ path: key, message: 'Required'})
      }

      // validate numbers
      const typ = field.type;
      if (
        typ == FieldType.FLOAT ||
        typ == FieldType.INT
      ) {
        const valueFloat = parseFloat(''+value);
        if (isNaN(valueFloat)) {
          errors.push({ path: key, message: 'Invalid number'})
        }
      }

      // validate strings
      if (
        typ == FieldType.STRING
      ) {
        if ((''+value).length === 0) {
          errors.push({ path: key, message: 'Text field is required'})
        }
      }

      // validate dates
      // NOTE: only acceps dates in ISO string
      // TODO: check if field is required or optional
      if (
        typ == FieldType.DATE ||
        typ == FieldType.DATETIME
      ) {
        const valueDate = new Date(''+value);
        if (isNaN(valueDate.getTime())) {
          errors.push({ path: key, message: 'Date field is invalid'})
        }
      }
    }

    return errors;
  }

  function buildForm(project: FullProject) {
    for (const field of project.fields) {

      const useSimpleInput = Object.keys(inputTypes).includes(field.type);
      const typ = field.type;

      if (useSimpleInput) {
        const inputArgs: CMSInputProps = {
          placeholder: 'Enter ' + field.label,
          name: field.label,
          type: inputTypes[FieldType.STRING],
        };

        if (typ == FieldType.FLOAT) {
          inputArgs.type = inputTypes[FieldType.FLOAT]
          inputArgs.step = 0.1;
        } else if (typ == FieldType.INT) {
          inputArgs.type = inputTypes[FieldType.INT]
        } else if (typ == FieldType.DATETIME) {
          inputArgs.type = inputTypes[FieldType.DATETIME]
        } else if (typ == FieldType.DATE) {
          inputArgs.type = inputTypes[FieldType.DATE]
        } else if (typ == FieldType.BOOLEAN) {
          inputArgs.type = inputTypes[FieldType.BOOLEAN]
        } else if (typ != FieldType.STRING) {
          throw new Error(`Field with type '${field.type}' is not support :( Try again in an hour`);
        }

        const element = markRaw(resolveComponent('UInput') as typeof UInput);
        inputs.value.push({
          field,
          props: inputArgs,
          element,
        });
      } else {
        const element = markRaw(resolveComponent('UCheckbox') as typeof UCheckbox);
        if (typ == FieldType.BOOLEAN) {
          inputs.value.push({
            field,
            props: {
              label: field.label,
              name: field.label,
              type: 'checkbox',
              checked: false,
            },
            element,
          })
        }
      }
    }
  }

  async function submit() {
    try {
      await form.value!.validate();
    } catch(e) {
      // Do nothing as library takes care of errors
      // NOTE: this is to avoid uncaught rejected promises
      return;
    }

    if (props.project?.id && props.observation?.id) {
      // const res = await createObservation(props.project?.id, state.value);
      const res = await patchObservation(
        props.project.id,
        props.observation?.id,
        { data: state.value }
      );

      props.onSubmit?.();
    } else {
      throw createError({
        statusCode: 500,
        statusMessage: 'Project or observation does not exist',
      })
    }
  }
</script>