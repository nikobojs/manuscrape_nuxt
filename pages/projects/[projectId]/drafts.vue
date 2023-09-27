<template>
  <ResourceAccessChecker>
    <UContainer v-if="project">
      <div class="mt-6">
        <ObservationListWidget
          :project="project"
          :observations="observations"
          :show-create-button="false"
          :default-observation-filter="ObservationFilterTypes.MY_DRAFTS"
        />
      </div>
    </UContainer>
  </ResourceAccessChecker>
</template>


<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  const { requireProjectFromParams } = await useProjects();
  await ensureLoggedIn();
  const { params } = useRoute();

  const project = requireProjectFromParams(params);
  if (typeof project?.id !== 'number') {
    throw new Error('Project is not defined');
  }

  const { observations } = await useObservations(project.id);
</script>