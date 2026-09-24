<template>
  <UContainer>
    <ProjectList />
  </UContainer>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });
const { ensureUserFetched } = await useAuth();
await ensureUserFetched();
</script>
