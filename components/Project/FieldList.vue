<template>
  <!-- added fields right UCard -->
  <UCard
    v-if="fields.length > 0"
    class="overflow-y-auto shadow-xl max-w-full lg:min-w-[510px] h-full max-h-[450px]"
    :ui="{ header: { background: 'bg-[#0d1528]' }, body: { background:  'bg-[#0d1528]', padding: 'p-0' } }"
  >
    <UTable v-if="fields.length > 0" :rows="fields" :columns="fieldColumns">
        <!-- Cceate generic field group -->
        <template #actions-data="{ row }">
          <span class="flex items-center relative w-2 ml-1">
            <UIcon name="i-mdi-close" class="cursor-pointer text-lg absolute" @click="() => removeParameter(row)" />
          </span>
        </template>
        <template #label-data="{ row }">
          <UTooltip :ui="{
            base: 'invisible lg:visible px-2 py-1 text-xs font-normal block',
          }">
            <!-- Tool tip-->
            <template #text>
              <p class="max-w-xs break-words whitespace-normal">{{ row.label }}</p>
            </template>

            <!-- Label column -->
            <span class="block relative whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
              {{ row.label }}
            </span>
          </UTooltip>
        </template>
        <template #field-data="{ row }">
          <div class="flex gap-2">
            <UBadge size="xs" color="blue" variant="outline">
              {{ getFieldLabel(row.type) }}
            </UBadge>
            <UBadge size="xs" v-if="!row.required" color="gray" variant="solid">
              Optional
            </UBadge>
          </div>
        </template>
    </UTable>
  </UCard>
</template>

<script setup lang="ts">
  const props = defineProps({
    fields: requireProp<NewProjectField[]>(Array),
    onFieldsUpdate: requireFunctionProp<(fields: NewProjectField[]) => void | Promise<void>>(),
  })

  const fieldColumns = [
    {
      label: '',
      key: 'actions',
      class: 'px-0 flex items-center w-0 whitespace-nowrap'
    },
    {
      label: 'Parameter label',
      key: 'label',
    },
    {
      label: 'Parameter type',
      key: 'field'
    },
  ]

  function removeParameter(field: any) {
    const newFields = props.fields.filter(
      (f) => f.label !== field.label,
    );

    props.onFieldsUpdate(newFields);
  }

</script>