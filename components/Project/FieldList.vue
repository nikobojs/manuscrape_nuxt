<template>
  <!-- added fields right UCard -->
  <UCard
    v-if="fields.length > 0"
    class="overflow-y-auto shadow-xl max-w-full lg:w-full h-full max-h-[450px]"
    :ui="{ header: { background: 'bg-[#0d1528]' }, body: { background:  'bg-[#0d1528]', padding: 'p-0' } }"
  >
    <UTable
      v-if="fields.length > 0"
      :rows="fields"
      :sort="{ column: 'index', direction: 'asc'}"
      :columns="fieldColumns"
      :ui="{
        th: { padding: 'px-0 py-2.5' },
        td: { padding: 'px-0 py-2.5 text-xs' },
      }"
    >
        <!-- Cceate generic field group -->
        <template #actions-data="{ row }">
          <div class="flex items-center justify-end relative w-9">
            <UIcon name="i-mdi-close" class="absolute right-2 cursor-pointer text-lg" @click="() => removeParameter(row)" />
          </div>
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
            <div class="flex items-baseline w-[257px]">
              <span class="block relative whitespace-nowrap overflow-hidden text-ellipsis max-w-[256px]">
                {{ row.label }}
              </span>
              <span v-if="row.required" class="text-red-500 text-sm ml-1 inline-block">*</span>
            </div>
          </UTooltip>
        </template>
        <template #field-data="{ row }">
          <div class="flex gap-2">
            <UBadge size="xs" color="blue" variant="outline">
              {{ getFieldLabel(row.type) }}
            </UBadge>
          </div>
        </template>
        <template #remove-data="{ row }">
          <div class="flex items-center justify-end relative">
            <UDropdown :items="getFieldMenu(row)" class="right-0 relative">
              <UButton icon="i-mdi-dots-vertical" variant="link" color="gray" class="p-0 text-lg"
                :ui="{ rounded: 'rounded-full' }" />
            </UDropdown>
          </div>
        </template>
    </UTable>
  </UCard>
  <ProjectSetupChoicesModal
    :open="openChoicesModal"
    :onSubmit="submitNewChoices"
    :onClose="() => openChoicesModal = false"
    :defaultChoices="choicesOnOpen"
  />
</template>

<script setup lang="ts">
  import type { DropdownItem } from '@nuxthq/ui/dist/runtime/types';
  const props = defineProps({
    fields: requireProp<NewProjectField[]>(Array),
    onFieldsUpdate: requireFunctionProp<(fields: NewProjectField[]) => void | Promise<void>>(),
  });

  const toast = useToast();
  const fieldsCopy = computed(() => [...props.fields]);
  const openChoicesModal = ref(false);
  const choicesOnOpen = ref<string[]>([])
  const modifyingField = ref<NewProjectField | undefined>();
  const { report } = useSentry();

  const fieldColumns = [
    {
      label: '',
      key: 'actions',
      class: 'px-0 flex items-center'
    },
    {
      label: 'Parameter label',
      key: 'label',
    },
    {
      label: 'Parameter type',
      key: 'field'
    },
    {
      label: '',
      key: 'remove',
      class: ' min-w-[42px] flex justify-start'
    },
  ];

  function moveField(fieldIndex: number, direction: 1 | -1): void {
    const field = fieldsCopy.value.find(f => f.index === fieldIndex);
    if (!field) {
      report('warning', 'Field with that index was not found');
      return;
    }

    const filter = (f: { index: number }) => direction === 1
      ? f.index > field.index
      : f.index < field.index;

    const otherFieldsToMove = [...fieldsCopy.value]
      .filter(filter)
      .sort((a, b) => (direction === 1 ? a.index > b.index : a.index < b.index) ? 1 : -1);

    if (otherFieldsToMove.length === 0) {
      report('warning', 'Unable to move field as it has reached the boundary');
      return;
    }

    const temp = field.index;

    field.index = otherFieldsToMove[0].index;
    otherFieldsToMove[0].index = temp;

    props.onFieldsUpdate(fieldsCopy.value);
  }

  function modifyChoices(row: NewProjectField) {
    choicesOnOpen.value = row.choices || [];
    openChoicesModal.value = true
    modifyingField.value = row;
  }

  function submitNewChoices(config: DropDownConfig) {
    if (!modifyingField.value) {
      report('error', 'The variable \'modifyingField.value\' is falsy, when submitting new choices');
      toast.add({
        title: 'Unable to save the field :(',
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle'
      });
      return;
    } 

    const newFields = [...props.fields];
    const field = newFields.find((f) => f.index === modifyingField.value?.index);
    if (!field) {
      report('error', 'Unable to find any field with the same index as \'modyfingField.value.index\'');
      toast.add({
        title: 'Unable to save the field :(',
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle'
      });
      return;
    }

    field.choices = config.choices;

    props.onFieldsUpdate(newFields);
  }

  function getFieldMenu(row: NewProjectField): DropdownItem[][] {
    const fieldMenu: DropdownItem[][] = []
    const upDown: DropdownItem[] = []
    const actions: DropdownItem[] = []

    // add move up value if not in top
    if (row.index > 1) {
      upDown.push({
        label: 'Move up',
        icon: 'i-heroicons-arrow-up',
        click: () => {
          moveField(row.index, -1);
        },
      })
    }


    // add move up value if not in bottom
    if (row.index < props.fields.length) {
      upDown.push({
        icon: 'i-heroicons-arrow-down',
        label: 'Move down',
        click: () => {
          moveField(row.index, 1);
        },
      })
    }

    // add required checkbox action
    actions.push(row.required ? {
        icon: 'i-heroicons-wrench',
        label: 'Make optional',
        click: () => {
          row.required = false;
        },
    } : {
        icon: 'i-heroicons-wrench',
        label: 'Make required',
        click: () => {
          row.required = true;
        },
    });

    // add modify choices option if multiple choice field
    if (row.choices?.length) {
      // add remove field option
      actions.push({
        icon: 'i-mdi-pencil-outline',
        label: 'Modify choices',
        click: () => {
          modifyChoices(row);
        },
      });
    }

    // wrap up the whole menu inside 'fieldMenu'
    upDown.length > 0 && fieldMenu.push(upDown)
    actions.length > 0 && fieldMenu.push(actions)

    // add remove field option
    fieldMenu.push([{
      icon: 'i-mdi-close',
      label: 'Remove',
      click: () => {
        removeParameter(row);
      },
    }]);

    return fieldMenu;
  }

  function removeParameter(field: any) {
    const newFields = props.fields.filter(
      (f) => f.label !== field.label,
    );

    props.onFieldsUpdate(newFields);
  }

</script>