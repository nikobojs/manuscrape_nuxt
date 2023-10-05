<template>
  <UInput
    :modelValue="label"
    ref="fieldLabelInput"
    id="field-label-input"
    placeholder="Enter label"
    :onUpdate:modelValue="(_label: string) => {
      onFieldUpdate({ label: _label, type: fieldType as FieldType, required })
    }"
  />

  <div>
    <USelectMenu
      :onUpdate:modelValue="(_type: string) => {
        onFieldUpdate({ label, type: _type as FieldType, required })
      }"
      :modelValue="fieldType"
      :options="fieldTypeOptions"
      placeholder="Select type"
      valueAttribute="type"
      optionAttribute="label"
    >
      <template #label>
        {{  chosenFieldType?.label || 'Select type' }}
      </template>
    </USelectMenu>
    <div class="grid grid-cols-2 mt-3 w-full">
      <div class="items-center inline-flex">
        <UCheckbox
          :modelValue="required"
          :disabled="forceFieldRequired"
          label="Required?"
          :onUpdate:modelValue="(_required: boolean) => {
            onFieldUpdate({ label, type: fieldType as FieldType, required: _required })
          }"
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
          Add field
        </UButton>
      </div>
    </div>
  </div>
  <ProjectSetupChoicesModal
    :open="openDropdownModal"
    :onSubmit="addDropdownField"
    :onClose="() => openDropdownModal = false"
  />
</template>


<script setup lang="ts">
  import { ObservationFieldTypes, type FieldType } from '~/utils/observationFields';

  const props = defineProps({
    fieldType: requireProp<string | undefined>(String),
    label: requireProp<string>(String),
    required: requireProp<boolean>(Boolean),
    onFieldUpdate: requireFunctionProp<(f: NewProjectFieldDraft) => void | Promise<void>>(),
    onFieldAdd:requireFunctionProp<(f: NewProjectFieldDraft) => void | Promise<void>>(),
    addedFields: requireProp<NewProjectField[]>(Array),
    onError: requireFunctionProp<(msg: string) => void>(),
  });

  const openDropdownModal = ref(false);
  const chosenFieldType = computed(() =>
    fieldTypeOptions.find((o) => o.type === props.fieldType)
  )


  // computed bool that indicates if add field button is disabled or not
  const newFieldIsValid = computed<boolean>(() =>
    props.label.length > 0 && !!props.fieldType,
  );

  // handle when add field button is clicked
  function handleAddField() {
    if (!props.fieldType) {
      props.onError('Field type is not defined in props')
      // TODO: report error
      return;
    }

    // ensure field with the same name does not exist
    const existing = props.addedFields.find((f) => f.label === props.label);
    if (existing) {
      props.onError('Two fields cannot have the same label');
      return;
    }

    // if multiple choice types are chosen, give them the dropdown configurator!
    if (['CHOICE', 'AUTOCOMPLETE'].includes(props.fieldType)) {
      openDropdownModal.value = true;
    } else {
      // if not, just add the field
      props.onFieldAdd({
        label: props.label,
        type: props.fieldType as FieldType,
        required: props.required,
      });
    }
  }

  // computed bool that indicates if required-checkbox is locked to checked mode
  const forceFieldRequired = computed<boolean>(() => {
    if (
      props?.fieldType &&
      ['BOOLEAN'].includes(props.fieldType)
    ) {
      props.onFieldUpdate({
        required: true,
        type: props.fieldType as FieldType,
        label: props.label
      })
      return true;
    } else {
      props.onFieldUpdate({
        required: props.required,
        type: props.fieldType as FieldType,
        label: props.label
      })
      return false;
    }
  });

  // all the fields/options you can select when adding a field
  const fieldTypeOptions = Object.entries(
    ObservationFieldTypes
  ).map(([key, val]) => ({
    label: key,
    type: val,
  }));

  // this is called then the dropdown configurator modal is submitted
  function addDropdownField({ choices }: DropDownConfig) {
    if (!props.fieldType) {
      // TODO: report error
      props.onError('No field type was picked')
      return;
    }

    if (!props?.label) {
      // TODO: report error
      props.onError('No field label was defined')
      return;
    }
    if (!['CHOICE', 'AUTOCOMPLETE'].includes(props.fieldType)) {
      // TODO: report error
      props.onError(`Dropdown field type '${props.fieldType}' is not supported`);
    }

    props.onFieldAdd({
      label: props.label,
      type: props.fieldType as FieldType,
      required: props.required,
      choices,
    })
  }
</script>