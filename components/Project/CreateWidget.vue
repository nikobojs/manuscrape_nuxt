<template>
  <div class="flex gap-x-6 gap-y-6 bg-transparent justify-around px-6">

    <!-- project form left UCard -->
    <UCard class="overflow-hidden w-96 shadow-xl max-h-[450px]">
      <template #header>
        <CardHeader>Create project</CardHeader>
      </template>

      <form
        class="flex gap-3 flex-col"
        @submit.prevent="handleSubmitProject"
      >
        <!-- project name -->
        <label for="name-input">
          Name:
        </label>
        <UInput
          v-model="form.name"
          placeholder="Enter project name"
          id="name-input"
          required
        />

        <!-- project draft parameters form -->
        <label class="mt-5" for="field-label-input">
          Parameters
          <UTooltip :ui="{base: 'p-2 text-xs'}">
            <template #text>
              When adding observations later on, all the
              parameters will need to be set manually for each observation.
            </template>
            <UIcon name="i-heroicons-information-circle" />
          </UTooltip>
        </label>

        <div class="flex flex-col gap-3">
          <ProjectFieldForm
            :required="typeRequired"
            :label="typeLabel"
            :field-type="typeType"
            :added-fields="addedFields"
            :on-field-update="(field) => setFieldDraft(field)"
            :on-error="(msg) => error = msg"
            :on-field-add="(field) => addField(field)"
          />
        </div>

        <span v-text="error" v-if="error" class="block text-xs text-red-600"></span>

        <div class="mt-2 flex gap-x-3 justify-end">
          <UButton @click="onClose" color="gray" variant="outline">
            Cancel
          </UButton>
          <UButton type="submit" :loading="loading" :disabled="!newProjectIsValid">
            Create project
          </UButton>
        </div>
      </form>
    </UCard>

    <!-- project fields right UCard -->
    <ProjectFieldList
      :fields="addedFields"
      :onFieldsUpdate="(fields) => {
        addedFields = fields;
        form.fields = fields;
      }"
    />
  </div>
</template>


<script setup lang="ts">

  const props = defineProps({
    onClose: requireFunctionProp<() => void>()
  })

  const { createProject } = await useProjects();
  const toast = useToast();

  const loading = ref(false);
  const error = ref('');
  const fieldLabelInput = ref();

  const typeRequired = ref(false);
  const typeLabel = ref('');
  const typeType = ref<undefined | string>();
  const typeChoices = ref<undefined | string[]>();

  function setFieldDraft(draft: NewProjectFieldDraft) {
    typeRequired.value = draft.required;
    typeChoices.value = draft.choices;
    typeLabel.value = draft.label;
    typeType.value = draft.type;
  }


  // const fieldType = ref(undefined as NewProjectField | undefined);
  const { isElectron } = useDevice();
  const form = reactive<NewProjectBody>({
    name: '',
    fields: [],
  });

  const newProjectIsValid = computed<boolean>(() =>
    form.name.length > 0 && form.fields.length > 0
  );

  const addedFields = ref([] as NewProjectField[])


  async function handleSubmitProject() {
    loading.value = true;
    try {
      const res = await createProject(
        form.name,
        form.fields,
      );

      error.value = '';
      loading.value = false;

      if (!res?.id) {
        console.error(`Unable to read 'id' from createProject api response`);
        toast.add({
          title: 'Server error :(',
          description: `We're working to fix this as soon as possible`
        });
        // TODO: capture error
      }

      if (isElectron.value) {
        window.electronAPI.projectCreated(res);
      } else {
        toast.add({
          title: 'Project was created successfully.'
        });
        props.onClose();
        setTimeout(() => {
          form.name = '';
          form.fields = [];
          addedFields.value = [];
          typeLabel.value = '';
          typeType.value = undefined;
          typeChoices.value = undefined;
          error.value = '';
        }, 300);
      }
    } catch (err: any) {
      error.value = (err?.statusMessage || err?.message).toString();
    }
  }


  async function addField(field: NewProjectFieldDraft) {

    const label = field.label;
    const type = field?.type;
    const required = field.required;
    const choices = [...(field?.choices || [])];

    if (!type) {
      error.value = 'You need to choose a type for the new field'
      return;
    }

    const newField = {
      label,
      type,
      required,
      choices,
    };

    form.fields.push(newField);
    addedFields.value.push(newField)

    typeLabel.value = '';
    typeType.value = undefined;
    typeChoices.value = undefined;
    error.value = '';
    window.requestAnimationFrame(() => fieldLabelInput.value?.input?.focus?.());
  }

  onMounted(() => {
    error.value = '';
  });
</script>