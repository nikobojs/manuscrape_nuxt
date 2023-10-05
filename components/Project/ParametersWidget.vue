<template>

  <UCard class="dark:bg-[#11151e] col-span-2 bg-[#11151e] h-full">
    <template #header>
      <div class="h-4 flex justify-between relative">
        <CardHeader>Parameters</CardHeader>
        <UPopover>
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

  <UModal v-bind:model-value="open" v-on:close="() => open = false">
    <UCard>
      <UCommandPalette v-if="projectFieldCommandPalette" placeholder="Search parameters..." nullable
        :empty-state="{ icon: 'i-mdi-magnify', label: 'hello', queryLabel: 'Unable to find parameters with that label' }"
        :groups="[{ key: 'project-parameters', commands: projectFieldCommandPalette }]"
        :fuse="{ resultLimit: 6, fuseOptions: { threshold: 0.1 } }"
        @update:model-value="(val: any) => {
          selectedParameter = val;
          openConfirmDeleteParamModal = true;
          open = false;
        }"
      />
    </UCard>
  </UModal>

  <UModal
    v-bind:model-value="openConfirmDeleteParamModal"
    v-on:close="() => openConfirmDeleteParamModal = false"
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
            @click="() => { openConfirmDeleteParamModal = false }"
            color="gray"
          >Get me out of here!</UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
  import type { Command } from '@nuxthq/ui/dist/runtime/types';
  const openConfirmDeleteParamModal = ref(false);
  const open = ref(false);
  const selectedParameter = ref<null | { id: number, label: string }>();
  const toast = useToast();
  const { deleteParameter, sortFields } = await useProjects();

  const parametersMenu = [{
    label: 'Remove parameter',
    click: () => {
      open.value = true
    },
  }, {
    label: 'Add parameter',
    click: () => { console.log('add!') },
  }];

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
  async function handleDeleteParameter () {
    if (typeof selectedParameter.value?.id !== 'number') {
      console.warn('Parameter not selected when trying to delete parameter');
      // TODO: report
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