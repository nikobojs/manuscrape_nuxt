<template>
  <UForm ref="form" :validate="validate" :state="state" @submit="submit">
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
                  class="min-w-[200px]"
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
                  class="min-w-[200px]"
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
              <div v-else-if="field.type === 'MULTIPLE_CHOICE_ADD'">
                <USelectMenu
                  :name="field.label"
                  class="min-w-[200px]"
                  :options="getMultipleChoiceAddOptions(field as ProjectFieldResponse)"
                  v-model="state[field.label]"
                  :placeholder="field.required ? 'Select options or type freely' : 'Nothing picked'"
                  option-attribute="label"
                  :search-attributes="['label']"
                  :value-attributes="'label'"
                  multiple
                  searchable
                  creatable
                  by="label"
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
  import type { FormError } from '#ui/types/form';
  import { FieldType } from '~/utils/observationFields';

  const props = defineProps({
    observationId: {
      type: Number,
      required: true,
    },
    project: requireProjectProp,
    onSubmit: Function as PropType<Function>,
    disabled: Boolean as PropType<Boolean>,
    metadataDone: Boolean as PropType<Boolean>,
    initialState: Object as PropType<any>,
    inputs: requireProp<CMSInput[]>(),
  });

  const { params } = useRoute();
  const { sortFields } = await useProjects(params);
  const { patchObservation, observations } = await useObservations(props.project.id);

  function getMultipleChoiceAddOptions(field: ProjectFieldResponse) {
    const updatedOptions = (field.choices || [])
      .concat(getCustomFieldChoices(field, state))
      .map((o) => ({ label: o }));
    return updatedOptions;
  }

  const form = ref();
  const sortedFields = computed(() => sortFields(props.project));
  const observation = computed(() => observations.value.find((o) => o.id === props.observationId))
  const state = ref(Object.assign({ ...props.initialState }, observation.value?.data as any));


  // TODO: validation function doesn't seem completely functional
  //       - manuel edge-case testing required
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
      const field = sortedFields.value.find((field) => field.label == key);
      if (!field) {
        throw createError({
          statusCode: 500,
          statusMessage: `Field '${key}' does not exist :(`
        });
      }

      // check if field is required or optional
      if (field.required && (value === null || value === undefined)) {
        errors.push({ path: key, message: 'Required'});
      }

      // validate numbers
      const typ = field.type;
      if (
        typ == FieldType.FLOAT ||
        typ == FieldType.INT
      ) {
        const valueFloat = parseFloat(''+value);
        if (isNaN(valueFloat)) {
          errors.push({ path: key, message: 'Invalid number'});
        }
      }

      // validate strings
      if (typ == FieldType.STRING) {
        // TODO: explain why
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
          errors.push({ path: key, message: 'Date field is invalid'});
        }
      }
    }

    return errors;
  }

  async function submit() {
    try {
      await form.value!.validate();
    } catch(e) {
      // Do nothing as library takes care of errors
      // NOTE: this is to avoid uncaught rejected promises
      return;
    }

    const _res = await patchObservation(
      props.project.id,
      props.observationId,
      { data: state.value }
    );

    props.onSubmit?.();
  }
</script>