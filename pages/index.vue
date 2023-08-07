<template>
  <UContainer>
    <div class="mb-10">
      <ProjectList />
    </div>
    <div class="mb-10">
      <ProjectForm />
    </div>
  </UContainer>
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  await useUser();
  await ensureLoggedIn();
</script>