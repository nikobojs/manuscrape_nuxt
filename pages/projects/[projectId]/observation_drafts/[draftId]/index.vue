<template>
  <UContainer>
    <h3 class="text-2xl">Create observation in "{{project.name}}"</h3>
    <div class="text-sm mb-4">STEP 1 OF 3</div>
    <div class="grid grid-cols-4">
      <ObservationForm
        class="col-span-1"
        v-if="draft"
        :project="project"
        :draft="draft"
      />
      <div class="col-span-3"></div>
    </div>
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