<template>
  <div>
    <UTable
      :data="suggestedFields"
      :columns="fieldColumns"
      :ui="{
        thead: 'hidden',
        th: 'px-3 py-2.5',
        td: 'px-3 py-2.5 text-xs',
        tbody: 'divide-y divide-gray-700',
      }"
    >
      <template #label-cell="{ row }">
        <!-- Label column -->
        <div class="flex gap-x-2 items-center min-w-[257px] relative">
          <div class="text-lg absolute -left-3 -translate-x-full">
            <UIcon
              class="text-lg"
              color="neutral"
              name="mdi:lightbulb-alert-outline"
            />
          </div>
          <div class="flex items-center gap-x-1.5 w-full">
            <UInput
              v-model="row.original.label"
              class="w-full"
              size="xs"
              placeholder="Insert label"
            />
            <div class="flex items-center ml-0.5">
              <UButton
                square
                variant="soft"
                color="neutral"
                class="rounded-full flex items-center justify-center p-1"
                @click="() => selectSuggestedParameter(row.original)"
              >
                <UIcon name="mdi:check" class="text-green-500 text-lg" />
              </UButton>
            </div>
            <div class="flex items-center">
              <UButton
                square
                color="neutral"
                variant="soft"
                class="rounded-full flex items-center justify-center p-1"
                @click="() => removeParameter(row.original)"
              >
                <UIcon name="i-mdi-close" class="text-red-500 text-lg" />
              </UButton>
            </div>
          </div>
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
const emit = defineEmits<{
  "select:field": [NewProjectField];
}>();
const suggestedFields = defineModel<NewProjectField[]>({
  default: () => [],
});
const fieldColumns: TableColumn<any>[] = [
  {
    header: "",
    accessorKey: "label",
  },
  {
    header: "",
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
      color: "error",
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
      color: "error",
      icon: "i-heroicons-exclamation-triangle",
    });
    return;
  }

  field.choices = config.choices;
}
</script>
