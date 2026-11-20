<template>
  <div>
    <USelectMenu
      v-model="model"
      :items="fieldTypeOptions"
      placeholder="Select type"
      value-key="value"
      label-key="label"
    >
    </USelectMenu>
  </div>
</template>

<script lang="ts" setup>
const model = defineModel<FieldType | undefined>();

// all the fields/options you can select when adding a field
const fieldTypeOptions = Object.entries(ObservationFieldTypes).map(
  ([key, val]) => ({
    label: key,
    value: val,
  }),
);

const chosenFieldType = computed(() =>
  fieldTypeOptions.find((o) => o.value === model.value),
);
</script>
