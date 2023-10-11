<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center h-4">
        <CardHeader>
          Dynamic fields
          <UTooltip class="ml-2" :ui="{base: 'p-2 text-xs'}">
            <template #text>
              <p class="mb-3">
                Dynamic fields will "automagically" generate their value when exporting observations.
              </p>
              <p>
                An example is time difference. A project may contain 2 ordinary timestamps parameters. To avoid entering the time difference manually for each observation, you can create a dynamic field measuring the time difference instead.
              </p>
            </template>
            <UIcon class="text-lg" name="i-heroicons-information-circle" />
          </UTooltip>
        </CardHeader>
        <div class="inline-flex gap-3" v-if="isOwner">
          <UButton
            icon="i-heroicons-plus"
            variant="outline"
            color="blue"
            @click="() => openCreateDynamicFieldModal = true"
          >
            Create dynamic field
          </UButton>
        </div>
      </div>
    </template>

    <div>
      <UTable
        v-if="rows.length > 0"
        :rows="rows"
      />
      <div class="text-sm italic text-gray-400" v-else>
        No dynamic fields
      </div>
    </div>
  </UCard>
  <ProjectCreateDynamicFieldModal
    v-if="project"
    :project="project"
    :open="openCreateDynamicFieldModal"
    :on-close="onCloseDynamicFieldModal"
  />
</template>

<script setup lang="ts">
  const props = defineProps({
    project: requireProjectProp,
  });

  const { dynamicFields, operators } = await useDynamicFields(props.project.id);
  const openCreateDynamicFieldModal = ref(false);

  const fields = computed(() => props.project.fields);
  const getFieldById = (id: number) => fields.value.find((f) => f.id === id);
  const { params } = useRoute();
  const { isOwner } = await useProjects(params);

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

  async function onCloseDynamicFieldModal () {
    openCreateDynamicFieldModal.value = false;
  }
</script>