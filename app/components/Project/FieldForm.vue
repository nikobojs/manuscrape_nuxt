<template>
  <div class="flex flex-col gap-1.5">
    <UInput
      v-model="typeLabel"
      ref="fieldLabelInput"
      id="field-label-input"
      placeholder="Enter label"
    />

    <div>
      <ProjectFieldTypeDropdown v-model="typeType" />
      <div class="flex justify-between mt-3 w-full">
        <div class="items-center inline-flex">
          <UCheckbox
            v-model="typeRequired"
            :disabled="forceFieldRequired"
            label="Required?"
          />
        </div>
        <div class="w-full text-right">
          <UButton
            icon="i-heroicons-plus"
            variant="outline"
            color="blue"
            type="button"
            @click="() => handleAddField()"
            :disabled="!newFieldIsValid"
          >
            Add parameter
          </UButton>
        </div>
      </div>
    </div>
    <ProjectSetupChoicesModal
      :open="openDropdownModal"
      :onSubmit="addDropdownField"
      :onClose="() => (openDropdownModal = false)"
      :defaultChoices="_defaultChoices"
    />

    <span v-text="error" v-if="error" class="block text-xs text-red-600"></span>
  </div>
</template>

<script setup lang="ts">
import { isMultipleChoice } from "#imports";

const _defaultChoices = ref<string[]>([]);

const error = ref("");
const fieldLabelInput = ref();

const typeRequired = ref(false);
const typeLabel = ref("");
const typeType = ref<undefined | FieldType>();
const typeChoices = ref<undefined | string[]>();
const model = defineModel<NewProjectField[]>({ default: () => [] });

const emit = defineEmits<{
  "add:field": [NewProjectField];
}>();

watch([typeRequired, typeLabel, typeType, typeChoices], () => {
  error.value = "";
});

const openDropdownModal = ref(false);

const { report } = useSentry();

// computed bool that indicates if add field button is disabled or not
const newFieldIsValid = computed<boolean>(() => {
  console.log({
    typeLabel: typeLabel.value,
    typeType: typeType.value,
  });
  return typeLabel.value.length > 0 && !!typeType.value;
});

function resetForm() {
  typeLabel.value = "";
  typeType.value = undefined;
  typeChoices.value = undefined;
  window.requestAnimationFrame(() => fieldLabelInput.value?.input?.focus?.());
}

// handle when add field button is clicked
function handleAddField() {
  if (!typeType.value) {
    const err = "Field type is not defined in props";
    error.value = err;
    report("error", err);
    return;
  }

  // ensure field with the same name does not exist
  const existing = model.value.find((f) => f.label === typeLabel.value);
  if (existing) {
    error.value = "Two fields cannot have the same label";
    return;
  }

  // if multiple choice types are chosen, give them the dropdown configurator!
  if (typeType.value && isMultipleChoice(typeType.value)) {
    openDropdownModal.value = true;
  } else {
    // if not, just add the field
    addField({
      label: typeLabel.value,
      type: typeType.value,
      required: typeRequired.value,
    });
  }
}

// computed bool that indicates if required-checkbox is locked to checked mode
const forceFieldRequired = computed<boolean>(() => {
  if (typeType.value && ["BOOLEAN"].includes(typeType.value)) {
    typeRequired.value = true;
    return true;
  } else {
    return false;
  }
});

// this is called then the dropdown configurator modal is submitted
function addDropdownField({ choices }: DropDownConfig) {
  if (!typeType.value) {
    const err = "No field type was picked";
    report("error", err);
    error.value = err;
    return;
  }

  if (!typeLabel.value) {
    const err = "No field label was defined";
    report("error", err);
    error.value = err;
    return;
  }
  if (!isMultipleChoice(typeType.value)) {
    const err = `Dropdown field type '${typeType.value}' is not supported`;
    report("error", err);
    error.value = err;
    return;
  }

  addField({
    label: typeLabel.value,
    type: typeType.value,
    required: typeRequired.value,
    choices,
  });
}

async function addField(field: NewProjectFieldDraft) {
  const label = field.label;
  const type = field?.type;
  const required = field.required;
  const choices = [...(field?.choices || [])];

  if (!type) {
    // error.value = "You need to choose a type for the new field";
    error.value = "You need to choose a type for the new field";
    return;
  }

  // const nextIndex = Math.max(-1, ...model.value.map((f) => f.index)) + 1;
  if (!field.type) {
    // newFieldError.value = "You did not select a field type";
    error.value = "You need to select a field type";
    return;
  }
  const newField: NewProjectField = {
    label,
    type,
    required,
    choices,
    index: model.value.length,
  };

  // ensure all other params are ok even though we know the indexes are ok at this point
  const newFields = enforceCorrectIndexes([...model.value, newField]);
  emit("add:field", newField);
  model.value = newFields;
  resetForm();
}
</script>
