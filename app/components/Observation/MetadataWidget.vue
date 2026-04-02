<template>
  <div>
    <UCard v-show="loading" class="overflow-visible">
      <template #header>
        <div>
          <div class="flex justify-between w-full">
            <CardHeader>Observation parameters loading...</CardHeader>
            <Spinner />
          </div>
        </div>
      </template>
      <div class="h-64"></div>
    </UCard>
    <ClientOnly>
      <UForm
        v-show="!loading"
        ref="form"
        :validate="validate"
        :state="state"
        @submit="submit"
      >
        <UCard class="overflow-visible">
          <template #header>
            <div>
              <div class="flex justify-between w-full">
                <CardHeader>Observation parameters </CardHeader>
                <div class="flex justify-end items-center gap-x-1.5">
                  <UIcon
                    v-if="!$props.disabled && metadataDone"
                    class="ml-2 text-lg text-green-500"
                    name="i-heroicons-check"
                  />
                </div>
              </div>
            </div>
          </template>

          <div class="flex flex-col gap-4">
            <div v-if="hasUnsaved && observation.isDraft">
              <UAlert color="teal" variant="soft" title="Heads up!">
                <template #description>
                  <div>
                    <p>
                      You have unsaved changes of the observation parameters
                    </p>
                  </div>
                </template>

                <template #actions>
                  <div class="flex justify-end w-full">
                    <UButton
                      variant="soft"
                      color="white"
                      icon="i-mdi-trash-outline"
                      @click="revertDraftChanges"
                      >Revert changes</UButton
                    >
                  </div>
                </template>
              </UAlert>
            </div>
            <div
              v-show="state && inputs.length > 0"
              v-for="{ props, field } in inputs"
            >
              <UFormGroup :name="field.label" :label="`${field.label}:`">
                <div class="inline-block">
                  <UCheckbox
                    v-if="
                      field.type === 'BOOLEAN' &&
                      typeof state[field.label] === 'boolean'
                    "
                    v-model="state[field.label]"
                    v-bind="props"
                    :disabled="!!$props.disabled"
                    :default-value="false"
                  />
                  <UTextarea
                    v-else-if="field.type === 'TEXTAREA'"
                    v-model="state[field.label]"
                    v-bind="props"
                    variant="outline"
                    :disabled="!!$props.disabled"
                  />
                  <UInput
                    v-else-if="
                      field.type === 'DATE' ||
                      (field.type === 'DATETIME' && state[field.label])
                    "
                    v-model="state[field.label]"
                    v-bind="props"
                    class="flex-shrink"
                    :disabled="!!$props.disabled"
                    @input="(asd: Event) => fourDigitYear(asd)"
                  />
                  <div v-else-if="field.type === 'CHOICE'">
                    <div
                      class="flex items-center gap-2"
                      v-for="choice in field.choices"
                    >
                      <URadio
                        :id="`radio-${choice}`"
                        :key="choice"
                        v-model="state[field.label]"
                        :name="field.label"
                        :value="choice"
                        :disabled="!!$props.disabled"
                      />
                      <label
                        :for="`radio-${choice}`"
                        v-if="state[field.label]"
                        >{{ choice }}</label
                      >
                    </div>
                  </div>
                  <div
                    v-else-if="field.type === 'AUTOCOMPLETE'"
                    class="flex flex-col items-end gap-x-2"
                  >
                    <USelectMenu
                      class="min-w-[200px]"
                      :options="field.choices"
                      v-model="state[field.label]"
                      :placeholder="
                        field.required ? 'Select option' : 'None chosen'
                      "
                      :disabled="!!$props.disabled"
                      :popper="{
                        adaptive: false,
                        offsetDistance: -3,
                        placement: 'bottom-start',
                      }"
                    />
                    <div
                      @click="() => (state[field.label] = undefined)"
                      class="text-sky-500 opacity-60 hover:opacity-100 transition-all cursor-pointer text-xs"
                    >
                      reset
                    </div>
                  </div>
                  <div
                    v-else-if="field.type === 'AUTOCOMPLETE_ADD'"
                    class="items-end flex-col flex"
                  >
                    <USelectMenu
                      class="min-w-[200px]"
                      :options="field.choices"
                      v-model="state[field.label]"
                      :placeholder="
                        field.required ? 'Select or type option' : 'None chosen'
                      "
                      creatable
                      searchable
                      :searchable-placeholder="
                        field.required
                          ? 'Search or write custom text...'
                          : 'None chosen'
                      "
                      :disabled="!!$props.disabled"
                    >
                      <template #option-create="{ option }">
                        <span class="flex-shrink-0 text-gray-400 text-xs"
                          >Custom:</span
                        >
                        <span>
                          {{ option?.label || option }}
                        </span>
                      </template>
                    </USelectMenu>
                    <div
                      @click="() => (state[field.label] = undefined)"
                      class="text-sky-500 opacity-60 hover:opacity-100 transition-all cursor-pointer text-xs"
                    >
                      reset
                    </div>
                  </div>
                  <div
                    v-else-if="field.type === 'MULTIPLE_CHOICE_ADD'"
                    class="items-end flex-col flex"
                  >
                    <USelectMenu
                      :name="field.label"
                      class="min-w-[200px]"
                      :options="
                        getMultipleChoiceAddOptions({
                          choices: field.choices,
                          label: field.label,
                        })
                      "
                      v-model="state[field.label]"
                      :placeholder="
                        field.required
                          ? 'Select options or type freely'
                          : 'Nothing picked'
                      "
                      multiple
                      searchable
                      creatable
                      by="label"
                      :disabled="!!$props.disabled"
                    >
                      <template #option-create="{ option }">
                        <span class="flex-shrink-0 text-gray-400 text-xs"
                          >Custom:</span
                        >
                        <span>
                          {{ option.label }}
                        </span>
                      </template>
                      <template #label>
                        <span v-if="state[field.label].length" class="truncate"
                          >{{ state[field.label].length }} selected</span
                        >
                        <span v-else>Select multiple options</span>
                      </template>
                    </USelectMenu>
                    <div
                      @click="() => (state[field.label] = [])"
                      class="text-sky-500 opacity-60 hover:opacity-100 transition-all cursor-pointer text-xs"
                    >
                      reset
                    </div>
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
            v-show="!props.disabled"
            variant="outline"
            @click="submit"
            :disabled="!!$props.disabled"
          >
            Save observation parameters
          </UButton>
        </UCard>
      </UForm>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import type { FormError } from "#ui/types";

const props = defineProps({
  observation: {
    type: Object as PropType<FullObservation>,
    required: true,
  },
  project: requireProjectProp,
  onSubmit: Function as PropType<Function>,
  disabled: Boolean as PropType<Boolean>,
  loading: Boolean as PropType<Boolean>,
  hasUnsaved: Boolean as PropType<Boolean>,
  initialState: Object as PropType<any>,
  inputs: requireProp<CMSInput[]>(),
});

const observation = computed(() => props.observation);
const hasUnsaved = computed(() => props.hasUnsaved);

const { patchObservation, observations } = await useObservations(
  props.project.id,
);

const emit = defineEmits<{
  "update:data": [any];
  "revert:data": [];
}>();

const form = ref();
const sortedFields = computed(() =>
  sortFieldsByIndex(props.project.fields).filter(
    (pf) => !["IMAGE_SINGLE", "IMAGE_MULTIPLE"].includes(pf.type),
  ),
);

const state = ref({ ...(props.initialState || {}) } as any);

const metadataDone = computed(() => validate(state.value).length === 0);

onMounted(() => {
  const _state = {
    ...(props.initialState || {}),
  };

  state.value = _state;
});

// watch for changes and emit change event with data to parent component
watch(
  state,
  (_state) => {
    emit("update:data", _state);
  },
  { deep: true },
);

function validate(state: Record<string, any>): FormError[] {
  return validateObservationForm(state, sortedFields.value);
}

function revertDraftChanges() {
  const obsHasData =
    observation.value?.data &&
    typeof observation.value.data === "object" &&
    Object.keys(observation.value.data).length > 0;
  if (obsHasData) {
    state.value = observation.value?.data;
  } else if (observation.value) {
    const emptyObsData = getEmptyObservationData(props.project);
    state.value = emptyObsData;
  } else {
    console.error("Unexpected state during reverting of draftchanges");
    // TODO: report error
  }
  emit("revert:data");
}

function getMultipleChoiceAddOptions(field: {
  choices: string[] | undefined;
  label: string;
}): {
  label: string;
}[] {
  const updatedOptions: string[] = field?.choices || [];
  const result = updatedOptions
    .concat(getCustomFieldChoices(field, state))
    .map((o: string) => ({ label: o }));
  return result;
}

async function submit() {
  try {
    console.log("validating form...");
    await form.value!.validate();
  } catch (e) {
    console.warn(e);
    // Do nothing as library takes care of errors
    // NOTE: this is to avoid uncaught rejected promises
    return;
  }

  const _res = await patchObservation(props.project.id, props.observation.id, {
    data: state.value,
  });

  props.onSubmit?.(true);
}
</script>
