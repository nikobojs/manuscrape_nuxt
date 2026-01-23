<template>
  <USelectMenu
    :options="options"
    v-model="field"
  />
</template>

<script setup lang="ts">
  const emit = defineEmits(['update:selectedFieldId']);
  const props = defineProps({
    selectedFieldId: Number as PropType<undefined | number>,
    fields: requireProp<{id: number; label: string}[]>(Array),
  });

  const options = computed(() => props.fields);

  const field = computed({
    get() {
      return props.fields.find(f => f.id == props.selectedFieldId)
    },
    set(selectedField) {
      emit('update:selectedFieldId', selectedField?.id)
    }
  });

</script>