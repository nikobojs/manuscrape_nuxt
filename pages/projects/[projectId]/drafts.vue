<template>
  <ResourceAccessChecker>
    <UContainer v-if="project">
      <div class="mt-6">
        <ObservationListWidget
          :project="project"
          :show-create-button="false"
          :default-observation-filter="ObservationFilterTypes.MY_DRAFTS"
        />
      </div>
    </UContainer>
  </ResourceAccessChecker>
</template>


<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await ensureLoggedIn();
  const { params } = useRoute();
  const { project } = await useProjects(params);

  if (typeof project.value?.id !== 'number') {
    throw new Error('Project is not defined');
  }
</script>