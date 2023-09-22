<template>
  <USelectMenu :options="options" :model-value="modelValue" />
</template>

<script setup lang="ts">
  defineEmits(['update:modelValue']);
  const props = defineProps({
    modelValue: Object as PropType<undefined | number>,
    fields: requireProp<{}[]>(Array),
  });

  const options = computed(() => {
    console.log('fields:', props.fields);
    return props.fields;
  });
</script>