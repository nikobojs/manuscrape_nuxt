<template>
  <UContainer>
    <ProjectList :new-project-id="newProjectId" />
    <div class="mb-10">
      <ProjectForm :onNewProjectCreated="(id: number) => newProjectId = id" />
    </div>
  </UContainer>
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
  const newProjectId = ref(0);
</script>