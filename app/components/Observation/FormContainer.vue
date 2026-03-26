<template>
  <div
    class="grid md:grid-cols-2 sm:grid-cols-1 grid-cols-1 gap-6 auto-rows-min"
    v-if="observation && observationForm?.inputs"
  >
    <div class="row-span-4">
      <ObservationMetadataWidget
        :project="project"
        :has-unsaved="hasUnsavedVersion"
        :observation="observation"
        :onSubmit="onMetadataSubmit"
        :disabled="isLocked"
        :initialState="initialObservationForm"
        :inputs="observationForm?.inputs || []"
        :loading="!observationForm || formLoading"
        @revert:data="
          () => {
            hasUnsavedVersion = false;
          }
        "
        @update:data="onMetadataDraftUpdate"
      />
    </div>

    <div class="row-span-3 flex flex-col gap-6">
      <ObservationImageWidget
        v-if="projectHasImageParams"
        :project="project"
        :observation="observation"
        :onSubmit="onImagesChange"
        :inputs="observationForm.imageInputs"
        :disabled="isLocked"
      />

      <UCard
        v-if="!isLocked || (isLocked && observation.fileUploads.length > 0)"
      >
        <template #header>
          <CardHeader>Files</CardHeader>
        </template>
        <ObservationFileUploadForm
          :observation="observation"
          :project="project"
          :on-file-uploaded="onFileUploaded"
          :on-file-deleted="onFileDeleted"
        />
      </UCard>

      <UCard v-if="!isLocked">
        <template #header>
          <CardHeader>Actions</CardHeader>
        </template>
        <div class="flex gap-4 mb-6">
          <UButton
            icon="i-heroicons-lock-closed"
            class=""
            :disabled="!metadataDone"
            @click="() => handlePublishObservation()"
          >
            Submit and lock
          </UButton>
          <UButton
            v-if="isDeletable"
            icon="i-mdi-delete-outline"
            color="red"
            variant="outline"
            @click="() => handleDiscardDraft()"
          >
            Delete draft
          </UButton>
        </div>
        <UAlert
          variant="outline"
          icon="i-mdi-information-outline"
          color="blue"
          title="Submit and lock"
          v-if="!isDelockable"
          description="When an observation is submitted, it will be locked for future editing.
          This includes uploading files, image editing and metadata editing."
          :ui="{ title: 'text-sm font-bold' }"
        />
      </UCard>

      <UCard v-else="observation">
        <template #header>
          <CardHeader>Details</CardHeader>
        </template>
        <div
          class="grid grid-cols-2 w-full border border-gray-700 rounded-md bg-slate-950 p-3"
        >
          <div class="text-gray-400">ID:</div>
          <div>#{{ observation.id }}</div>
          <div class="text-gray-400">Created by:</div>
          <div>{{ observation.user?.email || "Unknown" }}</div>
          <div class="text-gray-400">Draft created at:</div>
          <div>{{ prettyDate(observation.createdAt, true) }}</div>
          <div class="text-gray-400">Last updated at:</div>
          <div>{{ prettyDate(observation.updatedAt, true) }}</div>
        </div>
        <div class="flex gap-x-4">
          <div class="mt-6" v-if="isDelockable">
            <UButton
              icon="i-mdi-lock-open-variant-outline"
              color="yellow"
              variant="outline"
              @click="() => handleDelock()"
            >
              Unlock observation
            </UButton>
          </div>
          <div class="mt-6" v-if="isDeletable">
            <UButton
              icon="i-mdi-delete-outline"
              color="red"
              variant="outline"
              @click="() => handleDelete()"
            >
              Delete observation
            </UButton>
          </div>
        </div>
      </UCard>
      <ObservationTagsWidget
        :project="project"
        :observation-id="observation.id"
        :tags-on-observation="tagsOnObservation"
        :on-tag-created="onTagCreated"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  onObservationPublished: Function as PropType<Function>,
  onFormSubmit: Function as PropType<(showToast?: boolean) => void>,
  onDelockObservation: Function as PropType<Function>,
  onImagesChange: Function as PropType<() => Promise<void>>,
  onFileUploaded: requireFunctionProp<(file: File) => Promise<void>>(),
  onFileDeleted: requireFunctionProp<() => Promise<void>>(),
  onTagCreated: requireFunctionProp<() => Promise<void>>(),
  metadataDone: Boolean as PropType<boolean>,
  imageUploaded: Boolean as PropType<boolean>,
  observation: {
    type: Object as PropType<FullObservation>,
    required: true,
  },
  project: requireProjectProp,
});

const tagsOnObservation = computed(() => props.observation?.tags || []);
const imgUploaded = computed(() => props.imageUploaded);
const formLoading = ref(true);
const hasUnsavedVersion = ref(false);
const projectHasImageParams = computed(
  () =>
    props.project.fields
      .map((f) => f.type)
      .findIndex((t) => ["IMAGE_SINGLE", "IMAGE_MULTIPLE"].includes(t)) !== -1,
);

const { user } = await useUser();

const {
  getObservationMetadataDraft,
  metadataDraft,
  removeObservationMetadataDraft,
  updateObservationMetadataDraft,
  observationHasModifiedDraft,
} = useMetadataDraftStore();

const initialObservationForm = ref<any>(
  buildInitialForm(props.observation, props.project),
);

watch(
  [props.observation, props.project],
  ([obs, pro]) => {
    if (JSON.stringify(obs.data) === "") {
      // the observation is empty and probably new or abandoned after creation
      return;
    }
    const hasUnsaved = observationHasModifiedDraft(obs, pro);
    hasUnsavedVersion.value = hasUnsaved;
  },
  { deep: true },
);

function onMetadataDraftUpdate(data: any) {
  const obs = props.observation;
  if (!obs) {
    // TODO: report error
    throw new Error("Observation value is not defined");
  }

  const existingDraftData = getObservationMetadataDraft(obs.id);

  if (obs.isDraft) {
    updateObservationMetadataDraft(obs.id, data);
  } else if (existingDraftData) {
    removeObservationMetadataDraft(obs.id);
    hasUnsavedVersion.value = false;
  }
}
const observationForm = ref<{
  inputs: CMSInput[];
  imageInputs: CMSInput[];
}>({ inputs: [], imageInputs: [] });

function buildInitialForm(obs: FullObservation, project: FullProject) {
  const sessStorageCached = getObservationMetadataDraft(obs.id);
  const emptyObs = getEmptyObservationData(project);

  let result = {
    ...emptyObs,
    ...(obs?.data ? obs.data : {}),
  };

  if (observationHasModifiedDraft(obs, project)) {
    result = { ...result, ...sessStorageCached };
    hasUnsavedVersion.value = true;
  } else {
    hasUnsavedVersion.value = false;
  }

  return result;
}

const {
  refreshObservations,
  deleteObservation,
  patchObservation,
  observationIsDeletable,
  observationIsDelockable,
} = await useObservations(props.project.id);
const toast = useToast();
const { isElectron } = useDevice();

const isDeletable = computed(() =>
  observationIsDeletable(props.observation, user.value, props.project),
);

const isDelockable = computed(() =>
  observationIsDelockable(props.observation, user.value, props.project),
);

const isLocked = computed(
  () => props.observation != null && !props.observation.isDraft,
);

onBeforeMount(() => {
  if (!props.observation)
    throw new Error("Observation is not defined when populating metadata form");
  const initialMetadataFormVal = buildInitialForm(
    props.observation,
    props.project,
  );
  const form = buildForm(props.project.fields);
  initialObservationForm.value = initialMetadataFormVal;
  observationForm.value = form;
  formLoading.value = false;
});

function onMetadataSubmit(...args: any[]) {
  hasUnsavedVersion.value = false;
  props.onFormSubmit?.(...args);
}

async function handlePublishObservation() {
  try {
    const _ = await patchObservation(props.project.id, props.observation.id, {
      isDraft: false,
    });
    props.onObservationPublished?.();
  } catch (e) {
    const msg = getErrMsg(e);
    toast.add({
      title: msg,
      color: "red",
    });
  }
}

async function handleDelock() {
  if (!props.project || !props.observation) {
    throw new Error("Props are not defined");
  }
  const confirmed = confirm(
    `Are you sure you want to unlock observation #${props.observation.id} ?`,
  );
  if (!confirmed) return;

  try {
    const _ = await patchObservation(props.project.id, props.observation.id, {
      isDraft: true,
    });
    toast.add({
      title: "Observation unlocked successfully",
      color: "green",
      icon: "i-heroicons-check",
    });
    props.onDelockObservation?.();
  } catch (e) {
    const msg = getErrMsg(e);
    toast.add({
      title: msg,
      color: "red",
    });
  }
}

async function handleDiscardDraft() {
  if (!props.project || !props.observation) {
    throw new Error("Props are not defined");
  }
  const confirmed = confirm("Are you sure you want to delete this draft?");
  if (!confirmed) return;

  await deleteObservation(props.project.id, props.observation.id);
  removeObservationMetadataDraft(props.observation.id);
  if (isElectron.value) {
    window.close();
  } else {
    toast.add({
      title: "Draft has been deleted",
      color: "green",
      icon: "i-heroicons-check",
    });
    await refreshObservations();
    navigateTo(`/projects/${props.project.id}`);
  }
}

async function handleDelete() {
  if (!props.project || !props.observation) {
    throw new Error("Props are not defined");
  }
  const confirmed = confirm(
    `Are you sure you want to delete observation #${props.observation.id} ?`,
  );
  if (!confirmed) return;
  await deleteObservation(props.project.id, props.observation.id);
  removeObservationMetadataDraft(props.observation.id);
  if (isElectron.value) {
    window.close();
  } else {
    toast.add({
      title: "Observation has been deleted permanently",
      color: "green",
      icon: "i-heroicons-check",
    });
    await refreshObservations();
    navigateTo(`/projects/${props.project.id}`);
  }
}
</script>
