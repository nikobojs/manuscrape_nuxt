<template>
  <UContainer v-if="!isElectron">
    <h2 class="text-3xl mb-8">Settings</h2>
  </UContainer>
  <UContainer :class="`grid gap-8${isElectron ? ' -mt-8' : ''}`">
    <SettingsScrollshot v-if="isElectron" />
    <SettingsProjects v-if="user?.projectAccess.length" />
    <SettingsProfile />
  </UContainer>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

const { ensureUserFetched } = await useAuth();
const { user } = await useUser();
await ensureUserFetched(); // this is apparently required for this page to work correctly in electron
const { isElectron } = useDevice();
</script>
