<template>
  <USelectMenu
    value-attribute="id"
    option-attribute="label"
    :options="projectMenu"
    :class="class"
    v-model="selectedProjectId"
    searchable
    @change="onProjectChange"
    placeholder="Choose project"
  >
  </USelectMenu>
</template>

<script setup lang="ts">
  const props = defineProps({
    project: {
      type: Object as PropType<FullProject | null>,
        required: false,
    },
    setProject: requireFunctionProp<(p: FullProject) => Promise<void>>(),
    defaultProjectId: {
      type: Number,
      required: false,
      default: undefined,
    },
    class: {
      type: String,
      required: false,
      default: true,
    }
  });

  const selectedProjectId = ref<number | undefined>(undefined);
  const { ensureUserFetched } = await useAuth();
  await ensureUserFetched();
  const { user, projects } = await useUser();

  const projectMenu = computed(() => {
    if (!user || !projects.value?.length) {
      return []
    }

    const result =  projects.value.map((p) => ({
      label: p.name,
      href: '/projects/' + p.id,
      id: p.id,
    })).sort((a, b) => a.label.localeCompare(b.label));

    return result;
  });

  function onProjectChange(projectId: number) {
    const project = projects.value.find((p) => p.id === projectId);

    if (!project) {
      props.setProject(projects.value[0]);
      selectedProjectId.value = projects.value[0].id;
    } else {
      props.setProject(project);
      selectedProjectId.value = project.id;
    }
  }

  onMounted(() => {
    if (typeof props.defaultProjectId === 'number') {
      onProjectChange(props.defaultProjectId);
    }
  });
</script>