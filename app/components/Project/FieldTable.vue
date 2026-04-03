<template>
  <div>
    <UTable
      v-if="fields.length > 0"
      :rows="fields"
      :sort="{ column: 'index', direction: 'asc' }"
      :columns="fieldColumns"
      :ui="{
        th: { padding: 'px-3 py-2.5' },
        td: { padding: 'px-3 py-2.5 text-xs' },
      }"
    >
      <!-- Cceate generic field group -->
      <template #first-data="{ row }">
        <div class="flex items-center justify-end relative text-lg">
          <div class="absolute left-2 flex items-center gap-x-2">
            <UIcon
              name="i-mdi-trash-outline"
              class="cursor-pointer text-red-500"
              @click="() => removeParameter(row)"
            />
          </div>
        </div>
      </template>
      <template #label-data="{ row, index }">
        <!-- Label column -->
        <div class="flex gap-x-2 items-center w-[257px] relative">
          <UTooltip>
            <!-- Tool tip-->
            <template #text>
              <div>
                <p class="max-w-xs break-words whitespace-normal">
                  {{ row.label }}
                </p>
              </div>
            </template>
            <span
              class="block relative whitespace-nowrap overflow-hidden text-ellipsis max-w-[256px] content-center"
            >
              {{ row.label }}
            </span>
            <span
              v-if="row.required"
              class="text-red-500 text-sm ml-1 inline-block"
              >*</span
            >
          </UTooltip>
        </div>
      </template>
      <template #field-data="{ row }">
        <div class="flex gap-2">
          <UBadge size="xs" color="blue" variant="outline">
            {{ getFieldLabel(row.type) }}
          </UBadge>
        </div>
      </template>
      <template #last-data="{ row }">
        <div class="flex items-center justify-end relative">
          <UDropdown :items="getFieldMenu(row)" class="right-0 relative">
            <UButton
              icon="i-mdi-dots-vertical"
              variant="link"
              color="gray"
              class="p-0 text-lg"
              :ui="{ rounded: 'rounded-full' }"
            />
          </UDropdown>
        </div>
      </template>
    </UTable>
    <ProjectSetupChoicesModal
      :open="openChoicesModal"
      :onSubmit="submitNewChoices"
      :onClose="() => (openChoicesModal = false)"
      :defaultChoices="choicesOnOpen"
    />
  </div>
</template>

<script setup lang="ts">
import type { DropdownItem } from "#ui/types";
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
const fieldColumns = [
  {
    label: "",
    key: "first",
    class: "px-0 flex items-center min-w-[26px]",
  },
  {
    label: "Label",
    key: "label",
  },
  {
    label: "Type",
    key: "field",
  },
  {
    label: "",
    key: "last",
    class: " min-w-[42px] flex justify-start",
  },
];
function getFieldMenu(row: NewProjectField): DropdownItem[][] {
  const fieldMenu: DropdownItem[][] = [];
  const upDown: DropdownItem[] = [];
  const actions: DropdownItem[] = [];

  // add move up value if not in top
  if (row.index > 1) {
    upDown.push({
      label: "Move up",
      icon: "i-heroicons-arrow-up",
      click: () => {
        moveField(row.index, -1);
      },
    });
  }

  // add move up value if not in bottom
  if (row.index < props.fields.length) {
    upDown.push({
      icon: "i-heroicons-arrow-down",
      label: "Move down",
      click: () => {
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
          click: () => {
            row.required = false;
          },
        }
      : {
          icon: "i-heroicons-wrench",
          label: "Make required",
          click: () => {
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
      click: () => {
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
      click: () => {
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
      color: "red",
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
      color: "red",
      icon: "i-heroicons-exclamation-triangle",
    });
    return;
  }

  field.choices = config.choices;

  // props.onFieldsUpdate(newFields);
  emit("update:fields", newFields);
}
</script>
