<template>
  <div>
    <UTable
      :rows="suggestedFields"
      :sort="{ column: 'index', direction: 'asc' }"
      :columns="fieldColumns"
      :ui="{
        thead: 'hidden',
        th: { padding: 'px-3 py-2.5' },
        td: {
          padding: 'px-3 py-2.5 text-xs',
        },
        tbody: 'divide-y divide-gray-700 dark:divide-gray-700',
      }"
    >
      <template #label-data="{ row, index }">
        <!-- Label column -->
        <div class="flex gap-x-2 items-center min-w-[257px] relative">
          <div class="text-lg absolute -left-3 -translate-x-full">
            <UIcon
              class="text-lg"
              color="gray"
              name="mdi:lightbulb-alert-outline"
            />
          </div>
          <div class="flex items-center gap-x-1.5 w-full">
            <UInput
              v-model="row.label"
              class="w-full"
              size="xs"
              placeholder="Insert label"
            />
            <div class="flex items-center ml-0.5">
              <UButton
                square
                variant="soft"
                color="black"
                class="rounded-full flex items-center justify-center p-1"
                @click="() => selectSuggestedParameter(row)"
              >
                <UIcon name="mdi:check" class="text-green-500 text-lg" />
              </UButton>
            </div>
            <div class="flex items-center">
              <UButton
                square
                color="black"
                variant="soft"
                class="rounded-full flex items-center justify-center p-1"
                @click="() => removeParameter(row)"
              >
                <UIcon name="i-mdi-close" class="text-red-500 text-lg" />
              </UButton>
            </div>
          </div>
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
const emit = defineEmits<{
  "select:field": [NewProjectField];
}>();
const suggestedFields = defineModel<NewProjectField[]>({
  default: () => [],
});
const fieldColumns = [
  {
    label: "",
    key: "label",
  },
  {
    label: "",
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

function selectSuggestedParameter(field: NewProjectField) {
  emit("select:field", field);
  removeParameter(field);
}

function removeParameter(field: any) {
  const newFields = suggestedFields.value.filter(
    (f) => f.label !== field.label,
  );

  // props.onFieldsUpdate(newFields);
  // emit("update:fields", newFields);
  suggestedFields.value = newFields;
}

function modifyChoices(row: NewProjectField) {
  choicesOnOpen.value = row.choices || [];
  openChoicesModal.value = true;
  modifyingField.value = row;
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

  const newFields = [...suggestedFields.value];
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
}
</script>
