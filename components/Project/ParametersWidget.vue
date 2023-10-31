<template>

  <UCard class="dark:bg-[#11151e] col-span-2 bg-[#11151e] h-full">
    <template #header>
      <div class="h-4 flex justify-between relative">
        <CardHeader>Parameters</CardHeader>
        <UPopover v-if="isOwner">
          <UButton icon="i-mdi-dots-vertical" variant="link" color="gray" class="text-lg absolute right-0 -top-2"
            :ui="{ rounded: 'rounded-full' }" />
          <template #panel>
            <UVerticalNavigation :links="parametersMenu"></UVerticalNavigation>
          </template>
        </UPopover>
      </div>
    </template>

    <div class="flex flex-col -mt-6 -mb-6 -ml-6 -mr-6 max-h-[460px] overflow-y-auto">
      <div v-for="field in sortedFields" class="flex flex-col gap-y-1.5 p-3 border-b border-slate-800">
        <div class="flex items-center justify-between">
          <UBadge size="xs" variant="solid" color="white" class="text-xs">
            {{ getFieldLabel(field.type) }}
          </UBadge>
          <span class="text-xs text-gray-400">
            {{ prettyDate(field.createdAt) }}
          </span>
        </div>
        <div class="text-sm">
          <span v-if="field.required" class="text-red-500">*</span>
          {{ field.label }}
        </div>
      </div>
    </div>
  </UCard>

  <UModal
    v-if="isOwner"
    v-bind:model-value="openRemoveModal"
    v-on:close="() => openRemoveModal = false"
  >
    <UCard>
      <UCommandPalette v-if="projectFieldCommandPalette" placeholder="Search parameters..." nullable
        :empty-state="{ icon: 'i-mdi-magnify', label: 'hello', queryLabel: 'Unable to find parameters with that label' }"
        :groups="[{ key: 'project-parameters', commands: projectFieldCommandPalette }]"
        :fuse="{ resultLimit: 1000, fuseOptions: { threshold: 0.1 } }"
        @update:model-value="(val: any) => {
          if (val) {
            selectedParameter = val;
            openConfirmDeleteParamModal = true;
            openRemoveModal = false;
          }
        }"
      />
    </UCard>
  </UModal>

  <UModal
    v-if="isOwner"
    v-bind:model-value="openConfirmDeleteParamModal"
    v-on:close="() => {
      openConfirmDeleteParamModal = false;
      openRemoveModal = false;
    }"
  >
    <UCard>
      <template #header>
        <div>
          Confirm deletion of parameter
          <span class="bg-slate-950 ml-1 px-2 py-0.5 text-sm rounded-sm inline-block">
            {{  selectedParameter?.label }}
          </span>
          ?
        </div>
      </template>
      <UAlert
        color="yellow"
        variant="outline"
        icon="i-heroicons-exclamation-triangle"
        title="This action will remove data!"
        description="All observation data will have this parameter and associated data removed permanently."
      />
      <template #footer>
        <div class="flex gap-x-3">
          <UButton
            color="red"
            @click="() => handleDeleteParameter()"
          >
            I'm sure!
          </UButton>
          <UButton
            variant="outline"
            @click="() => { openConfirmDeleteParamModal = false; openRemoveModal = false; }"
            color="gray"
          >Get me out of here!</UButton>
        </div>
      </template>
    </UCard>
  </UModal>

  <UModal
    v-if="isOwner"
    v-bind:model-value="openAddParamModal"
    v-on:close="() => openAddParamModal = false"
    :ui="{
      base: 'relative text-left rtl:text-right overflow-visible w-full flex flex-col',
      width: 'sm:max-w-xs max-w-xs',
    }"
  >
    <UCard class="overflow-visible">
      <template #header>
        <div>
          Add new parameter
        </div>
      </template>

      <div class="flex flex-col gap-3">
        <ProjectFieldForm
          :added-fields="[]"
          :label="newFieldLabel"
          :field-type="newFieldType"
          :required="newFieldRequired"
          :on-field-update="(field) => setFieldDraft(field)"
          :on-error="(msg) => newFieldError = msg"
          :on-field-add="(field) => handleCreateParameter(field)"
        />
        <span class="red text-xs" v-if="newFieldError">{{  newFieldError  }}</span>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
  import type { Command } from '@nuxthq/ui/dist/runtime/types';
  const openConfirmDeleteParamModal = ref(false);
  const openRemoveModal = ref(false);
  const selectedParameter = ref<null | { id: number, label: string }>();
  const openAddParamModal = ref(false);
  const toast = useToast();
  const { params } = useRoute();
  const { deleteParameter, sortFields, createParameter, isOwner } = await useProjects(params);
  const { report } = useSentry();

  const newFieldRequired = ref(false);
  const newFieldLabel = ref('');
  const newFieldType = ref<undefined | string>();
  const newFieldChoices = ref<undefined | string[]>();
  const newFieldError = ref('');

  const props = defineProps({
    project: requireProjectProp,
    onProjectUpdated: requireFunctionProp<() => void | Promise<void>>(),
  });

  const sortedFields = computed(() => sortFields(props.project));

  const projectFieldCommandPalette = computed<Command[]>(
    () => sortedFields.value.map((f) => ({
      label: f.label,
      id: f.id,
    })),
  );

  const parametersMenu = [{
    label: 'Remove parameter',
    click: () => {
      openRemoveModal.value = true
    },
  }, {
    label: 'Add parameter',
    click: () => {
      openAddParamModal.value = true
    },
  }];


  function setFieldDraft(draft: NewProjectFieldDraft) {
    newFieldRequired.value = draft.required;
    newFieldChoices.value = draft.choices;
    newFieldLabel.value = draft.label;
    newFieldType.value = draft.type;
  }

  async function handleCreateParameter (field: NewProjectFieldDraft) {
    const nextIndex = Math.max(...props.project.fields.map(f => f.index)) + 1;
    if (!field.type) {
      newFieldError.value = 'You did not select a field type'
      return;
    } else if (typeof nextIndex !== 'number') {
      newFieldError.value = 'Unable to determine field index';
      report('fatal', 'Field index could not be calculated when adding new field')
      return;
    }

    const newField: NewProjectField = {
      label: field.label,
      required: field.required,
      type: field.type,
      ...(field.choices ? { choices: field.choices } : {}),
      index: props.project.fields.length,
    }

    createParameter(
      props.project.id,
      newField,
    ).then(async (res) => {
      if (res.status === 201) {
        toast.add({
          title: 'Parameter was successfully created!',
          icon: 'i-heroicons-check',
          color: 'green',
        });
        openAddParamModal.value = false;
        props.onProjectUpdated();
        setTimeout(() => {
          newFieldLabel.value = '',
          newFieldRequired.value = false;
          newFieldType.value = undefined;
          newFieldChoices.value = [];
          newFieldError.value = '';
        }, 300);
      } else {
        const json = await res.json();
        throw new Error(getErrMsg(json))
      }
    }).catch((err: Error) => {
      toast.add({
        title: err.message,
        icon: 'i-heroicons-exclamation-triangle',
        color: 'red',
      });
    });
  }

  async function handleDeleteParameter () {
    if (typeof selectedParameter.value?.id !== 'number') {
      report('error', 'Parameter not selected when trying to delete parameter');
      return;
    }

    deleteParameter(
      props.project.id,
      selectedParameter.value
    ).then(async (res) => {
      if (res.status === 204) {
        toast.add({
          title: 'Parameter was successfully deleted',
          icon: 'i-heroicons-check',
          color: 'green',
        });
        openConfirmDeleteParamModal.value = false;
        openRemoveModal.value = false;
        props.onProjectUpdated();
      } else {
        const json = await res.json();
        throw new Error(getErrMsg(json))
      }
    }).catch((err: Error) => {
      toast.add({
        title: err.message,
        icon: 'i-heroicons-exclamation-triangle',
        color: 'red',
      });
    });
  }
</script>