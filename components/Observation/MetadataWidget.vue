<template>
  <UForm ref="form" :validate="validate" :state="state" @submit.prevent="submit">
    <UCard class="overflow-visible">
      <template #header>
        <div class="flex justify-between w-full">
          <CardHeader>Observation parameters</CardHeader>
          <span v-if="!$props.disabled && metadataDone" class="ml-2 i-heroicons-check text-lg text-green-500"></span>
        </div>
      </template>

      <div class="flex flex-col gap-4">
        <div v-for="({ props, field }) in inputs">
          <UFormGroup :name="field.label" :label="`${field.label}:`">
            <div class="inline-block">
              <UCheckbox
                v-if="field.type === 'BOOLEAN'"
                v-model="state[field.label]"
                v-bind="props"
                :disabled="!!$props.disabled"
              />
              <UTextarea
                v-else-if="field.type === 'TEXTAREA'"
                v-model="state[field.label]"
                v-bind="props"
                variant="outline"
                :disabled="!!$props.disabled"
              />
              <UInput
                v-else-if="field.type === 'DATE' || field.type === 'DATETIME'"
                v-model="state[field.label]"
                v-bind="props"
                class="flex-shrink"
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
                    :disabled="!!$props.disabled"
                  />
                  <label :for="`radio-${choice}`">{{ choice }}</label>
                </div>
              </div>
              <div v-else-if="field.type === 'AUTOCOMPLETE'">
                <USelectMenu
                  :options="field.choices"
                  v-model="state[field.label]"
                  :placeholder="field.required ? 'Select option' : 'None chosen'"
                  :disabled="!!$props.disabled"
                  :popper="{
                    adaptive: false,
                    offsetDistance: -3,
                    placement: 'bottom-start',
                  }"
                />
              </div>
              <div v-else-if="field.type === 'AUTOCOMPLETE_ADD'">
                <USelectMenu
                  :options="field.choices"
                  v-model="state[field.label]"
                  :placeholder="field.required ? 'Select or type option' : 'None chosen'"
                  creatable
                  searchable
                  :searchable-placeholder="field.required ? 'Search or write custom text...' : 'None chosen'"
                  :disabled="!!$props.disabled"
                >
                  <template #option-create="{ option }">
                    <span class="flex-shrink-0 text-gray-400 text-xs">Custom:</span>
                    <span>
                      {{ option.label }}
                    </span>
                  </template>
                </USelectMenu>
              </div>
              <UInput
                v-else
                v-model="state[field.label]"
                v-bind="props"
                :disabled="!!$props.disabled"
              />
            </div>

          </UFormGroup>
        </div>
      </div>

      <!-- <template #footer> -->
        <div class="-ml-6 -mr-6 my-6">
          <div class="border-b border-gray-800 w-full"></div>
        </div>
        <UButton
          v-if="!props.disabled"
          variant="outline"
          type="submit"
          :disabled="!!$props.disabled"
        >
          Save metadata
        </UButton>
      <!-- </template> -->
    </UCard>
  </UForm>
</template>

<script lang="ts" setup>
  import type { FormError } from '@nuxthq/ui/dist/runtime/types/form';
  import { inputTypes, FieldType } from '~/utils/observationFields';

  const props = defineProps({
    observation: requireObservationProp,
    project: requireProjectProp,
    onSubmit: Function as PropType<Function>,
    disabled: Boolean as PropType<Boolean>,
    metadataDone: Boolean as PropType<Boolean>,
  });

  const { params } = useRoute();
  const { sortFields } = await useProjects(params);
  const { patchObservation } = await useObservations(props.project.id);

  const form = ref();
  const inputs = ref([] as CMSInput[]);
  const state = ref(props.observation?.data as any);
  const sortedFields = computed(() => sortFields(props.project));
  const { report } = useSentry();

  if (inputs.value.length == 0) {
    buildForm(sortedFields.value);
  }

  function validate(state: any): FormError[] {
    const errors = [] as FormError[];

    // scan for missing fields
    const missingFields = sortedFields.value.filter(f => {
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
      const field = sortedFields.value.find((field) => field.label == key)
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

  function buildForm(fields: ProjectFieldResponse[]) {
    for (const field of fields) {

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
          const err = new Error(`Field with type '${field.type}' is not support :( Try again in an hour`);
          report('error', err);
          throw err;
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
        } else if(typ == FieldType.TEXTAREA) {
          inputs.value.push({
            field,
            props: {
              name: field.label,
            } as CMSTextAreaProps,
          });
        } else if (isMultipleChoice(typ)) {
          if (!field.choices?.length) {
            report('error', 'Radio button type has no values to pick from');
            return;
          }

          inputs.value.push({
            field,
            props: {
              name: field.label,
            } as CMSMultipleChoiceProps,
          });
        } else {
          report('warning', `Field with type '${field.type}' is not support :( Try again in an hour`);
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