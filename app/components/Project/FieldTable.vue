<template>
  <div>
    <UTable
      v-if="fields.length > 0"
      :data="fields"
      :columns="fieldColumns"
      :ui="{
        th: 'px-3 py-2.5',
        td: 'px-3 py-2.5 text-xs',
      }"
    >
      <!-- Cceate generic field group -->
      <template #first-cell="{ row }">
        <div class="flex items-center justify-end relative text-lg">
          <div class="absolute left-2 flex items-center gap-x-2">
            <UIcon
              name="i-mdi-trash-outline"
              class="cursor-pointer text-red-500"
              @click="() => removeParameter(row.original)"
            />
          </div>
        </div>
      </template>
      <template #label-cell="{ row }">
        <!-- Label column -->
        <div class="flex gap-x-2 items-center w-[257px] relative">
          <UTooltip>
            <!-- Tool tip-->
            <template #content>
              <div>
                <p class="max-w-xs break-words whitespace-normal">
                  {{ row.original.label }}
                </p>
              </div>
            </template>
            <div class="block relative">
            <InputImportant
              :value="row.original.label || '-'"
              @edit="(newName: string) => {
                const oldName = row.original.label;
                if (oldName !== newName) {
                  editParameterName(oldName, newName);
                }
              }"
            />
            </div>
            <span
              v-if="row.original.required"
              class="text-red-500 text-sm ml-1 inline-block"
              >*</span
            >
          </UTooltip>
        </div>
      </template>
      <template #field-cell="{ row }">
        <div class="flex gap-2">
          <UBadge size="xs" color="info" variant="outline">
            {{ getFieldLabel(row.original.type) }}
          </UBadge>
        </div>
      </template>
      <template #last-cell="{ row }">
        <div class="flex items-center justify-end relative">
          <UDropdownMenu :items="getFieldMenu(row.original)" class="right-0 relative">
            <UButton
              icon="i-mdi-dots-vertical"
              variant="link"
              color="neutral"
              class="p-0 text-lg"
              :ui="{ base: 'rounded-full' }"
            />
          </UDropdownMenu>
        </div>
      </template>
    </UTable>
    <ProjectSetupChoicesModal
      :open="openChoicesModal"
      @submit="submitNewChoices"
      @close="() => (openChoicesModal = false)"
      :defaultChoices="choicesOnOpen"
    />
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from "#ui/types";
const toast = useToast();
const modifyingField = ref<NewProjectField | undefined>();
const { report } = useSentry();
const openChoicesModal = ref(false);
const choicesOnOpen = ref<string[]>([]);
const props = defineProps({
  fields: requireProp<NewProjectField[]>(Array),
});
const emit = defineEmits<{
  "update:fields": [NewProjectField[]];
}>();
const fieldsCopy = computed(() => [...props.fields]);
const fieldColumns: TableColumn<any>[] = [
  {
    header: "",
    accessorKey: "first",
    meta: { class: { td: "px-0 flex items-center min-w-[26px]" } },
  },
  {
    header: "Label",
    accessorKey: "label",
  },
  {
    header: "Type",
    accessorKey: "field",
  },
  {
    header: "",
    accessorKey: "last",
    meta: { class: { td: "min-w-[42px] flex justify-start" } },
  },
];
function getFieldMenu(row: NewProjectField): DropdownMenuItem[][] {
  const fieldMenu: DropdownMenuItem[][] = [];
  const upDown: DropdownMenuItem[] = [];
  const actions: DropdownMenuItem[] = [];

  // add move up value if not in top
  if (row.index > 0) {
    upDown.push({
      label: "Move up",
      icon: "i-heroicons-arrow-up",
      onClick: () => {
        moveField(row.index, -1);
      },
    });
  }

  // add move up value if not in bottom
  if (row.index < props.fields.length) {
    upDown.push({
      icon: "i-heroicons-arrow-down",
      label: "Move down",
      onClick: () => {
        moveField(row.index, 1);
      },
    });
  }

  // add required checkbox action
  actions.push(
    row.required
      ? {
          icon: "i-heroicons-wrench",
          label: "Make optional",
          onClick: () => {
            row.required = false;
          },
        }
      : {
          icon: "i-heroicons-wrench",
          label: "Make required",
          onClick: () => {
            row.required = true;
          },
        },
  );

  // add modify choices option if multiple choice field
  if (row.choices?.length) {
    // add remove field option
    actions.push({
      icon: "i-mdi-pencil-outline",
      label: "Modify choices",
      onClick: () => {
        modifyChoices(row);
      },
    });
  }

  // wrap up the whole menu inside 'fieldMenu'
  upDown.length > 0 && fieldMenu.push(upDown);
  actions.length > 0 && fieldMenu.push(actions);

  // add remove field option
  fieldMenu.push([
    {
      icon: "i-mdi-close",
      label: "Remove",
      onClick: () => {
        removeParameter(row);
      },
    },
  ]);

  return fieldMenu;
}

function removeParameter(field: any) {
  const newFields = props.fields.filter((f) => f.label !== field.label);

  // props.onFieldsUpdate(newFields);
  emit("update:fields", newFields);
}
function editParameterName(oldName: string, newName: string) {
  const existingField = props.fields.find((f) => f.label === oldName);
  if (existingField) {
    existingField.label = newName;
  }

  // props.onFieldsUpdate(newFields);
  emit("update:fields", props.fields);
}

function modifyChoices(row: NewProjectField) {
  choicesOnOpen.value = row.choices || [];
  openChoicesModal.value = true;
  modifyingField.value = row;
}
function moveField(fieldIndex: number, direction: 1 | -1): void {
  const field = fieldsCopy.value.find((f) => f.index === fieldIndex);
  if (!field) {
    report("warning", "Field with that index was not found");
    return;
  }

  const filter = (f: { index: number }) =>
    direction === 1 ? f.index > field.index : f.index < field.index;

  const otherFieldsToMove = [...fieldsCopy.value]
    .filter(filter)
    .sort((a, b) =>
      (direction === 1 ? a.index > b.index : a.index < b.index) ? 1 : -1,
    );

  if (otherFieldsToMove.length === 0) {
    report("warning", "Unable to move field as it has reached the boundary");
    return;
  }

  const temp = field.index;

  field.index = otherFieldsToMove[0]!.index;
  otherFieldsToMove[0]!.index = temp;

  // props.onFieldsUpdate(fieldsCopy.value);
  emit("update:fields", fieldsCopy.value);
}

function submitNewChoices(config: DropDownConfig) {
  if (!modifyingField.value) {
    report(
      "error",
      "The variable 'modifyingField.value' is falsy, when submitting new choices",
    );
    toast.add({
      title: "Unable to save the field :(",
      color: "error",
      icon: "i-heroicons-exclamation-triangle",
    });
    return;
  }

  const newFields = [...props.fields];
  const field = newFields.find((f) => f.index === modifyingField.value?.index);
  if (!field) {
    report(
      "error",
      "Unable to find any field with the same index as 'modyfingField.value.index'",
    );
    toast.add({
      title: "Unable to save the field :(",
      color: "error",
      icon: "i-heroicons-exclamation-triangle",
    });
    return;
  }

  field.choices = config.choices;

  // props.onFieldsUpdate(newFields);
  emit("update:fields", newFields);
}
</script>
