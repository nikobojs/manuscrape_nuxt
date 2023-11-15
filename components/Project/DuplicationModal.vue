
<template>
  <UModal
    v-bind:model-value="open"
    v-on:close="onClose"
  >
    <UCard>
      <template #header>
        Duplicate project {{ project ? `'${project.name}'` : '' }}
      </template>
      <UAlert
        color="blue"
        class="mb-6"
        variant="outline"
        icon="i-mdi-information-outline"
        title="Duplication of project"
        description="This action will create a new project with identical parameters. The observations will not be moved or copied. Collaborators won't be copied neither."
      />
      <label class="mb-3 block" for="project-dup-name">Project name</label>
      <UInput v-model="name" class="mb-6" id="project-dup-name" placeholder="Enter new project name" />
      <UButton :loading="loading" @click="submit">Duplicate project</UButton>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
  const props = defineProps({
    ...requireModalProps,
    project: Object as PropType<FullProject>,
    onProjectDuplicated: requireFunctionProp<(newProject: FullProject) => Promise<void>>(),
  });

  const { params } = useRoute();

  const { duplicateProject } = await useProjects(params);
  const { report } = useSentry();
  const loading = ref(false);
  const toast = useToast();
  const name = ref('');

  async function submit() {
    console.info('duplicating project', props?.project?.name || '', '!')
    if (!props.project) {
      report('error', 'Project is not defined in props');
      toast.add({
        title: 'Unexpected internal error',
        description: 'Project is not defined',
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle',
      });
    } else {
      loading.value = true;
      try {
        const res = await duplicateProject(name.value, props.project.id);
        const json = await res.json();
        if (res.status !== 201) {
          throw json;
        }

        await props.onProjectDuplicated(json as FullProject);

        // keep on loading state until modal has faded out
        setTimeout(() => {
          loading.value = false;
        }, 400);
      } catch(err) {
        console.error(err);
        const msg = getErrMsg(err)
        toast.add({
          title: 'Unexpected internal error',
          description: msg,
          color: 'red',
          icon: 'i-heroicons-exclamation-triangle',
        });
        loading.value = false;
      }
    }
  }
</script>