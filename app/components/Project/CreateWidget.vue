<template>
  <div
    class="flex flex-col lg:flex-row gap-x-6 gap-y-6 bg-transparent justify-around px-0"
  >
    <Transition name="fade">
      <div
        v-if="!templateSelected"
        class="absolute open:z-10 top-[50%] -translate-y-1/2"
      >
        <ProjectSelectTemplateForm
          @close="
            (ok) => {
              if (ok) {
                templateSelected = true;
              } else {
                props.onClose();
              }
            }
          "
          @select:parameters="
            (params) => {
              addedFields = params;
              form.fields = params;
              console.log('SELECTED PARAMS:::', params);
            }
          "
        />
      </div>
    </Transition>
    <Transition name="fade">
      <div
        class="w-full flex flex-col xl:flex-row gap-6"
        v-if="templateSelected"
      >
        <form @submit.prevent="handleSubmitProject">
          <!-- project form left UCard -->
          <UCard class="overflow-hidden w-80 shadow-xl">
            <template #header>
              <CardHeader>Create project</CardHeader>
            </template>

            <div
              class="flex gap-3 flex-col"
              @submit.prevent="handleSubmitProject"
            >
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
                        A parameter consists of a label and a type. This can be
                        a number, multiple choice, checkbox, etc.
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
        <div class="w-full">
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
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  onClose: requireFunctionProp<() => void>(),
});

const { params } = useRoute();
const { createProject } = await useProjects(params);
const toast = useToast();

const loading = ref(false);
const templateSelected = ref<boolean>(false);
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

const { isElectron } = useDevice();
const form = reactive<NewProjectBody>({
  name: "",
  fields: [],
});

const newProjectIsValid = computed<boolean>(
  () => form.name.length > 0 && form.fields.length > 0,
);

const addedFields = ref<NewProjectField[]>([]);

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
      // navigate to project
      await navigateTo(`/projects/${res.id}`);
      form.name = "";
      form.fields = [];
      addedFields.value = [];
      typeLabel.value = "";
      typeType.value = undefined;
      typeChoices.value = undefined;
      error.value = "";
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

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
