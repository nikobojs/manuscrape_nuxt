<template>
  <UContainer>
    <h2 class="text-3xl mb-3">{{ project?.name }}</h2>
    <UCard>
    </UCard>
  </UContainer>
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
  const { params } = useRoute();
  const { ensureHasOwnership, getProjectById, projects } = await useProjects();
  ensureHasOwnership(params?.id, projects.value);
  const project = computed(() => {
    const p = getProjectById(params?.id)
    return p;
  });



</script>