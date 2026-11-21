<template>
  <div class="flex flex-col xl:flex-row gap-x-6 gap-y-6 justify-around px-0">
    <div v-show="!templateSelected">
      <ProjectSelectTemplateForm
        :cancelable="cancelable"
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
            suggestedFields = params;
          }
        "
      />
    </div>
    <div class="w-full" v-show="templateSelected">
      <div class="mb-3 flex justify-between">
        <div>
          <UButton
            variant="ghost"
            color="neutral"
            class="flex items-center text-slate-500"
            @click="() => (templateSelected = false)"
          >
            <UIcon class="text-lg" name="mdi:arrow-left-top" />
            <span>Show project templates</span>
          </UButton>
        </div>
      </div>

      <div class="w-full flex flex-col xl:flex-row gap-6">
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
                v-model="projectName"
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
                  <template #content>
                    <UCard
                      :ui="{
                        body: 'px-2 py-2.5 sm:p-2',
                      }"
                    >
                      <p class="max-w-65">
                        A parameter consists of a label and a type. This can be
                        a number, multiple choice, checkbox, etc.
                      </p>
                    </UCard>
                  </template>
                  <UIcon name="i-heroicons-information-circle" />
                </UPopover>
              </label>

              <div class="flex flex-col gap-3">
                <ProjectFieldForm v-model="addedFields" />
              </div>
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
                <UButton
                  v-if="cancelable"
                  @click="onClose"
                  color="neutral"
                  variant="outline"
                >
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
            :suggestedFields="suggestedFields"
            @update:fields="
              (fields) => {
                const newFields = enforceCorrectIndexes([
                  ...fields.map((f) => toRaw(f)),
                ]);
                addedFields = newFields;
              }
            "
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { enforceCorrectIndexes } from "#shared/utils/observationFields";
const props = defineProps({
  onClose: requireFunctionProp<() => void>(),
  cancelable: {
    type: Boolean,
    required: false,
    default: () => false,
  },
});

const { params } = useRoute();
const { createProject } = await useProjects(params);
const toast = useToast();
const loading = ref(false);
const templateSelected = ref<boolean>(false);
const { isElectron } = useDevice();

const projectName = ref<string>("");
const addedFields = ref<NewProjectField[]>([]);
const suggestedFields = ref<NewProjectField[]>([]);

const newProjectIsValid = computed<boolean>(
  () => projectName.value.length > 0 && addedFields.value.length > 0,
);

async function handleSubmitProject() {
  loading.value = true;
  try {
    const res = await createProject(projectName.value, addedFields.value);

    loading.value = false;

    if (!res?.id) {
      console.error(`Unable to read 'id' from createProject api response`);
      toast.add({
        title: "Server error :(",
        color: "error",
        description: `We're working to fix this as soon as possible`,
      });
      return;
      // TODO: capture error
    }

    if (isElectron.value) {
      window.electronAPI.projectCreated(res);
    } else {
      toast.add({
        title: "Project was created successfully.",
      });
      props.onClose();
      // navigate to project
      await navigateTo(`/projects/${res.id}`);

      projectName.value = "";
      addedFields.value = [];
    }
  } catch (err: any) {
    console.error(" caught error:", { err });
    const msg =
      getErrMsg(err) || `We're working to fix this as soon as possible`;
    toast.add({
      title: "Error when creating project",
      color: "error",
      description: msg,
    });
  } finally {
    setTimeout(() => (loading.value = false), 300);
  }
}
</script>
