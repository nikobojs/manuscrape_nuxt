<template>
  <UContainer>
    <h2
      class="text-3xl"
      :class="{ 'mt-6 mb-3': isElectron, 'mb-8 mt-6': !isElectron }"
    >
      Settings
    </h2>
  </UContainer>
  <UContainer :class="`grid gap-8`">
    <SettingsProfile />
    <SettingsProjects v-if="user?.projectAccess.length" />
    <SettingsScrollshot v-if="isElectron" />
  </UContainer>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: "auth" });

const { ensureUserFetched } = await useAuth();
const { user } = await useUser();
await ensureUserFetched(); // this is apparently required for this page to work correctly in electron
const { isElectron } = useDevice();
</script>
