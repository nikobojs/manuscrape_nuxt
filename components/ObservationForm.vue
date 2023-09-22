<template>
  <UForm ref="form" :validate="validate" :state="state" @submit.prevent="submit">
    <div v-for="({ props, field }) in inputs" class="mb-4">
      <UFormGroup :name="field.label" :label="field.label">
        <UInput
          v-if="!['CHOICE', 'AUTOCOMPLETE', 'BOOLEAN', 'DATE', 'DATETIME'].includes(field.type)"
          v-model="state[field.label]"
          v-bind="props"
          :disabled="!!$props.disabled"
        />
        <UInput
          v-else-if="field.type === 'BOOLEAN'"
          v-model="state[field.label]"
          v-bind="props"
          :disabled="!!$props.disabled"
        />
        <UInput
          v-else-if="field.type === 'DATE' || field.type === 'DATETIME'"
          v-model="state[field.label]"
          v-bind="props"
          :disabled="!!$props.disabled"
          @input="(asd: Event) => fourDigitYear(asd)"
        />
        <div v-else-if="field.type === 'CHOICE'">
          <div class="flex items-center gap-2" v-for="choice in field.choices">
            <URadio
              :id="`radio-${choice}`"
              :key="choice"
              v-model="state[field.label]"
              :name="field.label"
              :value="choice"
            />
            <label :for="`radio-${choice}`">{{ choice }}</label>
          </div>
        </div>
        <div v-else-if="field.type === 'AUTOCOMPLETE'">
          <USelectMenu
            :options="field.choices"
            v-model="state[field.label]"
            searchable
          />
        </div>
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

  const props = defineProps({
    observation: requireObservationProp,
    project: requireProjectProp,
    onSubmit: Function as PropType<Function>,
    disabled: Boolean as PropType<Boolean>,
  });

  await useProjects();
  const { patchObservation } = await useObservations(props.project.id);

  const form = ref();
  const inputs = ref([] as CMSInput[]);
  const state = ref(props.observation?.data as any);

  enum FieldType {
    DATE = 'DATE',
    STRING = 'STRING',
    INT = 'INT',
    FLOAT = 'FLOAT',
    DATETIME = 'DATETIME',
    BOOLEAN = 'BOOLEAN',
    AUTOCOMPLETE = 'AUTOCOMPLETE',
    CHOICE = 'CHOICE',
  };

  const inputTypes: Record<string, string> = Object.freeze({
    [FieldType.DATE]: 'date',
    [FieldType.STRING]: 'text',
    [FieldType.INT]: 'number',
    [FieldType.FLOAT]: 'number',
    [FieldType.DATETIME]: 'datetime-local',
  });

  if (inputs.value.length == 0) {
    buildForm(props.project);
  }

  function validate(state: any): FormError[] {
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
      else if (
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
        } else if (typ != FieldType.STRING) {
          // TODO: report error
          throw new Error(`Field with type '${field.type}' is not support :( Try again in an hour`);
        }

        inputs.value.push({
          field,
          props: inputArgs,
        });
      } else {
        if (typ == FieldType.BOOLEAN) {
          inputs.value.push({
            field,
            props: {
              label: field.label,
              name: field.label,
              type: 'checkbox',
              checked: false,
            } as CMSCheckboxProps,
          })
        } else if(typ == FieldType.CHOICE || typ == FieldType.AUTOCOMPLETE) {
          if (!field.choices?.length) {
            console.error('Radio button type has no values to pick from');
            // TODO: report error
            return;
          }

          inputs.value.push({
            field,
            props: {
              name: field.label,
            } as CMSRadioGroupProps,
          });
        } else {
          // TODO: report error
          console.warn(`Field with type '${field.type}' is not support :( Try again in an hour`);
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

    const res = await patchObservation(
      props.project.id,
      props.observation?.id,
      { data: state.value }
    );

    props.onSubmit?.();
  }
</script>