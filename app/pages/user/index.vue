<template>
  <UContainer v-if="!isElectron">
    <h2 class="text-3xl mb-8">Settings</h2>
  </UContainer>
  <UContainer :class="`grid gap-8${ isElectron ? ' -mt-8' : ''}`">
    <SettingsScrollshot v-if="isElectron" />
    <SettingsProjects v-if="user?.projectAccess.length" />
    <SettingsProfile />
  </UContainer>
</template>

<script lang="ts" setup>
  const { ensureUserFetched } = await useAuth();
  await ensureUserFetched();
  const { user } = await useUser();
  const { isElectron } = useDevice();
</script>
