<template>
  <UContainer>
    <h3 class="text-2xl">Create observation in "{{project.name}}"</h3>
    <div class="text-sm mb-4">STEP 1 OF 3</div>
    <div class="grid grid-cols-4">
      <ObservationForm
        class="col-span-1"
        v-if="observation"
        :project="project"
        :observation="observation"
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
  const { ensureHasOwnership, requireProjectFromParams, projects } = await useProjects();
  const { requireObservationFromParams } = await useObservations();

  ensureHasOwnership(params?.projectId, projects.value);
  const project = requireProjectFromParams(params);
  const observation = await requireObservationFromParams(params);
</script>