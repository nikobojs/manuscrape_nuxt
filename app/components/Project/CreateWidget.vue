<template>
  <div
    class="flex flex-col lg:flex-row gap-x-6 gap-y-6 bg-transparent justify-around px-0"
  >
    <form @submit.prevent="handleSubmitProject">
      <!-- project form left UCard -->
      <UCard class="overflow-hidden w-80 shadow-xl">
        <template #header>
          <CardHeader>Create project</CardHeader>
        </template>

        <div class="flex gap-3 flex-col" @submit.prevent="handleSubmitProject">
          <!-- project name -->
          <label for="name-input"> Project name: </label>
          <UInput
            v-model="form.name"
            placeholder="Enter project name"
            id="name-input"
            required
          />

          <!-- project draft parameters form -->
          <p class="mt-5 text-sm text-gray-500">
            Configure the parameters you want to fill each time you (or a
            collaborator) adds an observation.
          </p>
          <label class="flex gap-x-0.5" for="field-label-input">
            <p>Parameters</p>
            <UPopover>
              <template #panel>
                <UCard
                  :ui="{
                    body: { padding: 'px-2 py-2.5 sm:p-2' },
                  }"
                >
                  <p class="max-w-[260px]">
                    A parameter consists of a label and a type. This can be a
                    number, multiple choice, checkbox, etc.
                  </p>
                </UCard>
              </template>
              <UIcon name="i-heroicons-information-circle" />
            </UPopover>
          </label>

          <div class="flex flex-col gap-3">
            <ProjectFieldForm
              :required="typeRequired"
              :label="typeLabel"
              :field-type="typeType"
              :added-fields="addedFields"
              :on-field-update="(field) => setFieldDraft(field)"
              :on-error="(msg) => (error = msg)"
              :on-field-add="(field) => addField(field)"
            />
          </div>

          <span
            v-text="error"
            v-if="error"
            class="block text-xs text-red-600"
          ></span>
        </div>
        <template #footer>
          <div class="flex gap-x-3 justify-start">
            <UButton
              type="submit"
              :loading="loading"
              :disabled="!newProjectIsValid"
            >
              Create project
            </UButton>
            <UButton @click="onClose" color="gray" variant="outline">
              Cancel
            </UButton>
          </div>
        </template>
      </UCard>
    </form>

    <!-- project fields right UCard -->
    <ProjectFieldList
      :fields="addedFields"
      :onFieldsUpdate="
        (fields) => {
          addedFields = [...fields];
          form.fields = [...fields];
        }
      "
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  onClose: requireFunctionProp<() => void>(),
});

const { params } = useRoute();
const { createProject } = await useProjects(params);
const toast = useToast();

const defaultFields = [
  {
    label: "SoMe username (example)",
    type: "STRING",
    required: false,
    index: 1,
  },
  {
    label: "Number of posts (example)",
    type: "INT",
    required: false,
    index: 2,
  },
  {
    label: "Platform (example)",
    type: "MULTIPLE_CHOICE_ADD",
    required: false,
    index: 3,
    choices: ["X", "Reddit", "Meta"],
  },
] as NewProjectField[];

const loading = ref(false);
const error = ref("");
const fieldLabelInput = ref();

const typeRequired = ref(false);
const typeLabel = ref("");
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
  name: "",
  fields: defaultFields,
});

const newProjectIsValid = computed<boolean>(
  () => form.name.length > 0 && form.fields.length > 0,
);

const addedFields = ref(defaultFields);

async function handleSubmitProject() {
  loading.value = true;
  try {
    const res = await createProject(form.name, form.fields);

    error.value = "";
    loading.value = false;

    if (!res?.id) {
      console.error(`Unable to read 'id' from createProject api response`);
      toast.add({
        title: "Server error :(",
        color: "red",
        description: `We're working to fix this as soon as possible`,
      });
      // TODO: capture error
    }

    if (isElectron.value) {
      window.electronAPI.projectCreated(res);
    } else {
      toast.add({
        title: "Project was created successfully.",
      });
      console.log("closing...");
      props.onClose();
      setTimeout(() => {
        form.name = "";
        form.fields = [];
        addedFields.value = [];
        typeLabel.value = "";
        typeType.value = undefined;
        typeChoices.value = undefined;
        error.value = "";
      }, 300);
    }
  } catch (err: any) {
    console.error(" caught error:", { err });
    const msg = getErrMsg(err);
    error.value = msg;
  } finally {
    setTimeout(() => (loading.value = false), 300);
  }
}

async function addField(field: NewProjectFieldDraft) {
  const label = field.label;
  const type = field?.type;
  const required = field.required;
  const choices = [...(field?.choices || [])];

  if (!type) {
    error.value = "You need to choose a type for the new field";
    return;
  }

  const newField = {
    label,
    type,
    required,
    choices,
    index: addedFields.value.length,
  };

  form.fields.push(newField);
  addedFields.value.push(newField);

  typeLabel.value = "";
  typeType.value = undefined;
  typeChoices.value = undefined;
  error.value = "";
  window.requestAnimationFrame(() => fieldLabelInput.value?.input?.focus?.());
}

onMounted(() => {
  error.value = "";
});
</script>
