<template>
  <USelectMenu
    value-attribute="id"
    option-attribute="label"
    :options="options"
    v-model="value"
  />
</template>

<script setup lang="ts">
  const emit = defineEmits(['update:modelValue']);
  const props = defineProps({
    modelValue: Number as PropType<undefined | number>,
    fields: requireProp<{id: number; label: string}[]>(Array),
  });

  const options = computed(() => props.fields);

  const value = computed({
    get() {
      return props.fields.find(f => f.id == props.modelValue)
    },
    set(value) {
      emit('update:modelValue', value)
    }
  });
</script>