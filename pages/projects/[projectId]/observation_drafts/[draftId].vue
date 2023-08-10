<template>
  <UContainer>
    <h3 class="text-2xl">Add observation</h3>
    <div class="text-sm mb-4">Project: {{ project?.name }}</div>
    <ObservationForm v-if="draft" :project="project" :draft="draft" />
  </UContainer>
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
  const { params } = useRoute();
  const { ensureHasOwnership, getProjectById, getObservationDraftById, projects } = await useProjects();
  ensureHasOwnership(params?.projectId, projects.value);
  const project = computed(() => {
    const p = getProjectById(params?.projectId)
    return p;
  });
  const draft = computed(() => {
    if (!project) return null;
    const o = getObservationDraftById(project.value, params?.draftId);
    return o;
  })
</script>