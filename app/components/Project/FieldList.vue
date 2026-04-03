<template>
  <!-- added fields right UCard -->
  <div class="overflow-y-visible max-w-full lg:w-full">
    <div class="flex flex-col gap-9">
      <div v-if="suggestedFields.length && suggested.length > 0">
        <UCard
          :ui="{
            background: 'dark:bg-slate-800 bg-slate-800',
            ring: 'ring-1 ring-gray-500 dark:ring-gray-700',
            body: {
              padding: 'pt-0 py-0 sm:p-2 sm:pb-2',
            },
          }"
        >
          <template #header>
            <CardHeader>
              <div class="flex gap-x-1.5 items-center">
                <UIcon class="text-xl" name="mdi:lightbulb-outline" />
                <p>Suggested parameters</p>
              </div>
            </CardHeader>
          </template>
          <ProjectSuggestedFieldsTable
            v-model="suggested"
            @select:field="(field) => emit('update:fields', [...fields, field])"
          />
        </UCard>
      </div>
      <UCard v-if="fields.length">
        <template #header> <CardHeader> Parameters </CardHeader> </template>
        <div class="-mx-6">
          <p
            class="text-slate-400 text-sm italic"
            v-if="suggestedFields.length === 0 && fields.length === 0"
          >
            No parameters added yet
          </p>
          <ProjectFieldTable
            :fields="fields"
            @update:fields="(fields) => emit('update:fields', fields)"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  fields: requireProp<NewProjectField[]>(Array),
  suggestedFields: requireProp<NewProjectField[]>(Array),
});

const suggested = ref(props.suggestedFields || []);

watch(
  () => props.suggestedFields,
  (fields) => {
    suggested.value = fields;
  },
  { immediate: true },
);

const emit = defineEmits<{
  "update:fields": [NewProjectField[]];
}>();
</script>
