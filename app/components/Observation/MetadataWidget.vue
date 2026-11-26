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
              <UAlert color="info" variant="soft" title="Heads up!">
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
                      color="neutral"
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
              <UFormField :name="field.label" :label="`${field.label}:`">
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
                    class="shrink"
                    :disabled="!!$props.disabled"
                    @input="(asd: Event) => fourDigitYear(asd)"
                  />
                  <div v-else-if="field.type === 'CHOICE'">
                    <URadioGroup
                      v-model="state[field.label]"
                      :items="
                        (field.choices || []).map((choice) => ({
                          label: choice,
                          value: choice,
                        }))
                      "
                      :disabled="!!$props.disabled"
                    />
                    <div
                      @click="() => (state[field.label] = [])"
                      class="mt-1.5 text-sky-500 opacity-60 hover:opacity-100 transition-all cursor-pointer text-xs"
                    >
                      reset
                    </div>
                  </div>
                  <div
                    v-else-if="field.type === 'AUTOCOMPLETE'"
                    class="flex flex-col items-end gap-x-2"
                  >
                    <USelectMenu
                      class="min-w-50"
                      :items="field.choices"
                      v-model="state[field.label]"
                      :placeholder="
                        field.required ? 'Select option' : 'None chosen'
                      "
                      :disabled="!!$props.disabled"
                      :content="{
                        side: 'bottom',
                        align: 'start',
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
                      class="min-w-50"
                      :items="field.choices"
                      v-model="state[field.label]"
                      :placeholder="
                        field.required ? 'Select or type option' : 'None chosen'
                      "
                      creatable
                      :search-input="{
                        placeholder: field.required
                          ? 'Search or write custom text...'
                          : 'None chosen',
                      }"
                      :disabled="!!$props.disabled"
                    >
                      <template #create-item-label="{ item }">
                        <span class="shrink-0 text-gray-400 text-xs"
                          >Custom:</span
                        >
                        <span>
                          {{ item }}
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
                    class="flex-col flex"
                  >
                    <div class="w-full flex flex-col gap-y-3 mb-3">
                      <label
                        v-for="it in getMultipleChoiceAddOptions({
                          choices: field.choices,
                          label: field.label,
                        })"
                        :key="it"
                        class="flex items-start gap-3"
                      >
                        <UCheckbox
                          :model-value="isChoiceSelected(field.label, it)"
                          @update:model-value="
                            (checked: boolean | 'indeterminate') =>
                              toggleChoice(field.label, it, checked === true)
                          "
                          :disabled="!!$props.disabled"
                        />
                        <p>{{ it }}</p>
                      </label>
                    </div>

                    <div
                      v-if="newOptionField === field.label"
                      class="flex gap-x-2 mb-2"
                    >
                      <UInput
                        v-model="newOptionValue"
                        placeholder="Enter new option"
                        size="xs"
                        :disabled="!!$props.disabled"
                        @keyup.enter="confirmNewOption(field)"
                      />
                      <UButton
                        size="xs"
                        variant="ghost"
                        color="info"
                        :disabled="!!$props.disabled || !newOptionValue.trim()"
                        @click="confirmNewOption(field)"
                      >
                        Save
                      </UButton>
                      <UButton
                        size="xs"
                        variant="ghost"
                        color="neutral"
                        @click="cancelNewOption"
                        class="text-gray-400"
                      >
                        Cancel
                      </UButton>
                    </div>

                    <div class="flex gap-x-1.5">
                      <div
                        v-if="!$props.disabled"
                        @click="() => openNewOptionInput(field.label)"
                        class="text-primary-400 opacity-60 hover:opacity-100 transition-all cursor-pointer text-xs"
                      >
                        add new
                      </div>
                      <div
                        @click="() => (state[field.label] = [])"
                        class="text-sky-500 opacity-60 hover:opacity-100 transition-all cursor-pointer text-xs"
                      >
                        deselect all
                      </div>
                    </div>
                  </div>
                  <UInput
                    v-else
                    v-model="state[field.label]"
                    v-bind="props"
                    :disabled="!!$props.disabled"
                  />
                </div>
              </UFormField>
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
const { report } = useSentry();

const emit = defineEmits<{
  "update:data": [any];
  "revert:data": [];
}>();

const sortedFields = computed(() =>
  sortFieldsByIndex(props.project.fields).filter(
    (pf) => !["IMAGE_SINGLE", "IMAGE_MULTIPLE"].includes(pf.type),
  ),
);

const state = ref({ ...(props.initialState || {}) } as any);

// per-field options created via the "add new" button (MULTIPLE_CHOICE_ADD);
// they are kept alongside the parameter's own choices for this session
const addedOptions = ref<Record<string, string[]>>({});
const newOptionField = ref<string | null>(null);
const newOptionValue = ref("");

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
    const errMsg = "Unexpected state during reverting of draftchanges";
    report("error", errMsg);
    console.error(errMsg);
  }
  emit("revert:data");
}

function getMultipleChoiceAddOptions(field: {
  choices?: string[];
  label: string;
}): string[] {
  const custom = getCustomFieldChoices(field, state);
  const added = addedOptions.value[field.label] || [];
  return [...new Set([...(field.choices || []), ...custom, ...added])];
}

function getChoiceValues(fieldLabel: string): { label: string }[] {
  const value = state.value[fieldLabel];
  return Array.isArray(value) ? value : [];
}

function isChoiceSelected(fieldLabel: string, choice: string): boolean {
  return getChoiceValues(fieldLabel).some((v) => v.label === choice);
}

function toggleChoice(fieldLabel: string, choice: string, checked: boolean) {
  const current = getChoiceValues(fieldLabel);
  state.value[fieldLabel] = checked
    ? [...current, { label: choice }]
    : current.filter((v) => v.label !== choice);
}

function openNewOptionInput(fieldLabel: string) {
  newOptionField.value = fieldLabel;
  newOptionValue.value = "";
}

function cancelNewOption() {
  newOptionField.value = null;
  newOptionValue.value = "";
}

function confirmNewOption(field: { choices?: string[]; label: string }) {
  const choice = newOptionValue.value.trim();
  if (!choice) return;

  const options = getMultipleChoiceAddOptions(field);
  if (!options.includes(choice)) {
    addedOptions.value = {
      ...addedOptions.value,
      [field.label]: [...(addedOptions.value[field.label] || []), choice],
    };
  }
  if (!isChoiceSelected(field.label, choice)) {
    toggleChoice(field.label, choice, true);
  }
  cancelNewOption();
}

async function submit() {
  const _res = await patchObservation(props.project.id, props.observation.id, {
    data: state.value,
  });

  props.onSubmit?.(true);
}
</script>
