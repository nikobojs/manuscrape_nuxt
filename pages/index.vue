<template>
  <div>
    <h1 v-show="!!user">Welcome, {{ user?.email || '' }}!</h1>
    <AppAlert>
      This is an auto-imported component
    </AppAlert>
    <ProjectList />
    <ProjectForm />
  </div>
</template>

<script lang="ts" setup>
  const { ensureLoggedIn } = await useAuth();
  const { user } = await useUser();
  await ensureLoggedIn();
</script>