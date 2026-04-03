<template>
  <div>
    <USelectMenu
      v-model="model"
      :options="fieldTypeOptions"
      placeholder="Select type"
      valueAttribute="type"
      optionAttribute="label"
    >
      <template #label>
        {{ chosenFieldType?.label || "Select type" }}
      </template>
    </USelectMenu>
  </div>
</template>

<script lang="ts" setup>
const model = defineModel<FieldType | undefined>();

// all the fields/options you can select when adding a field
const fieldTypeOptions = Object.entries(ObservationFieldTypes).map(
  ([key, val]) => ({
    label: key,
    type: val,
  }),
);

const chosenFieldType = computed(() =>
  fieldTypeOptions.find((o) => o.type === model.value),
);
</script>
