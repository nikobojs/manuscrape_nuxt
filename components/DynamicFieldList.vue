<template>
  <div>
    <UTable :rows="rows" :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'No dynamic fields.' }"  />
  </div>
</template>

<script setup lang="ts">
  const props = defineProps({
    project: requireProjectProp,
  });

  const { dynamicFields, operators } = await useDynamicFields(props.project.id);
  const fields = computed(() => props.project.fields);
  const getFieldById = (id: number) => fields.value.find((f) => f.id === id);

  const rows = computed(() => dynamicFields.value.map((f) => {
    const row = {
      'Label': f.label,
      'Created': prettyDate(f.createdAt),
      'Field 1': getFieldById(f.field0Id)?.label,
      'Field 2': getFieldById(f.field1Id)?.label,
      'Operator': operators.find((o) => o.value === f.operator)?.label || 'Unknown operator',
    };

    return row;
  }))
</script>