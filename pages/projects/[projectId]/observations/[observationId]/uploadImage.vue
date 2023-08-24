
<template>
  <UContainer>
    <h3 class="text-2xl">Upload raw png image:</h3>
    <div class="text-sm mb-4">STEP 2 OF 3 (can be skipped using <a href="https;//github.com/nikobojs/manuscrape_electron">manuscrape_electron</a>)</div>
    <div class="grid grid-cols-4">
      <ObservationImageUpload
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
  const observation = requireObservationFromParams(params, project.id);
</script>