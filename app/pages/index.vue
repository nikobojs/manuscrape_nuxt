<template>
  <UContainer>
    <p></p>
  </UContainer>
</template>

<script lang="ts" setup>
const { ensureLoggedIn } = await useAuth();
await useUser();
await ensureLoggedIn();
navigateTo("/projects");
</script>
