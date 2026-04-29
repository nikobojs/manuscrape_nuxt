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
const { ensureLoggedIn, ensureUserFetched } = await useAuth();
const { user } = await useUser();
await ensureUserFetched(); // this is apparently required for this page to work correctly in electron
await ensureLoggedIn();
const { isElectron } = useDevice();
</script>
