<template>
  <UContainer>
    <h2 class="text-3xl mb-3">{{ project?.name }}</h2>
    <UCard class="mb-4">
      <ObservationList :project="project" />
      <div class="text-right">
        <UButton
          icon="i-heroicons-pencil-square"
          variant="outline"
          @click="addObservationDraftClick"
        >
          Add observation
        </UButton>
      </div>
    </UCard>
  </UContainer>
</template>

<script lang="ts" setup>
  const error = ref(null);
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
  const { params } = useRoute();
  const { ensureHasOwnership, getProjectById, projects, createObservationDraft } = await useProjects();
  ensureHasOwnership(params?.projectId, projects.value);
  const project = computed(() => {
    const p = getProjectById(params?.projectId);
    return p;
  });

  async function addObservationDraftClick () {
    const res = await createObservationDraft(project.value.id).catch(
      (err) => error.value = err?.message
    );
    if (res?.id) {
      navigateTo(`/projects/${project.value.id}/observation_drafts/${res.id}`);
    }
  }
</script>