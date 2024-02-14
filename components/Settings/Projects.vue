<template>
  <SettingsBox
    title="Project settings"
    help="These settings applies to the chosen project, potentially affecting all collaborators on the respective project."
  >
    <div>
      <p class="mb-2">Choose a project to show its settings:</p>
      <div class="mb-6">
        <ProjectDropdown
          :project="project"
          :setProject="setProject"
          class="max-w-[350px] mr-3 h-7 w-[230px]"
        />
      </div>
      <div class="max-w-sm mb-4" v-if="project && !isOwner">
        <UAlert
          class="px-2 py-1"
          icon="i-mdi-warning-outline"
          title="As a collaborator, you are not able to change these settings"
          color="blue"
          variant="soft"
        />
      </div>
      <UCard class="max-w-sm" v-if="project">
        <form @submit.prevent="saveSettings" class="grid grid-cols-1 gap-y-2">
          <div class="flex justify-between items-baseline">
            <label for="project-id">Project name:</label>
            <UInput
              id="project-name"
              v-model="projectName"
              :disabled="loading || !isOwner"
            />
          </div>
          <div class="flex justify-between items-baseline">
            <label>Author can delock observations:</label>
            <UToggle
              id="author-can-delock"
              v-model="authorCanDelockObservations"
              :disabled="loading || !isOwner"
            />
          </div>
          <div class="flex justify-between items-baseline">
            <label>Owner can delock observations:</label>
            <UToggle
              id="owner-can-delock"
              v-model="ownerCanDelockObservations"
              :disabled="loading || !isOwner"
            />
          </div>
          <div v-if="isOwner">
            <UButton class="mt-4" type="submit" :disabled="loading">Save settings</UButton>
          </div>
          <span class="text-red-500 block mt-2 mb-2" v-if="error">{{ error }}</span>
        </form>
      </UCard>
    </div>
  </SettingsBox>
</template>


<script lang="ts" setup>
  const { ensureUserFetched } = await useAuth();
  await ensureUserFetched();
  const { hasRoles } = await useUser();
  const { patchProject } = await useProjects();
  const project = ref<FullProject | null>(null);

  const authorCanDelockObservations = ref(false);
  const ownerCanDelockObservations = ref(false);
  const projectName = ref('');
  const toast = useToast();
  const error = ref('');
  const loading = ref(false);
  const isOwner = computed(() => !!project.value && hasRoles(project.value.id, ['OWNER']));

  async function setProject(_project: FullProject) {
    project.value = _project;
    projectName.value = _project.name;
    authorCanDelockObservations.value = _project.authorCanDelockObservations;
    ownerCanDelockObservations.value = _project.ownerCanDelockObservations;
  }

  async function saveSettings() {
    error.value = '';
    loading.value = false;

    if (!project.value) {
      error.value = 'You need to pick a project';
      return;
    }

    const patch = {
      authorCanDelockObservations: authorCanDelockObservations.value,
      ownerCanDelockObservations: ownerCanDelockObservations.value,
      name: projectName.value,
    };

    try {
      const res = await patchProject(project.value.id, patch);
      if (res.status !== 200) {
        console.error(`patchProject api response returned ${res.status}`);
        toast.add({
          title: 'Server error :(',
          color: 'red',
          description: `We're working to fix this as soon as possible`
        });
        // TODO: report
      } else {
        toast.add({
          title: 'Project settings updated successfully',
          color: 'green',
        });
      }

      console.log()
    } catch (err: any) {
        console.log(' caught error:', {err})
        const msg = getErrMsg(err);
        error.value = msg;
    } finally {
      setTimeout(() => loading.value = false, 300);
    }
  }
</script>