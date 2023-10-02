<template>
  <div class="bg-gray-950">
    <AppHeader v-if="!hideNav" />
    <main class="pt-9 pb-6">
      <slot />
    </main>
    <AppFooter v-if="!hideNav" />
  </div>
  <UNotifications />
</template>

<script lang="ts" setup>
  const colorMode = useColorMode();
  colorMode.value = 'dark'
  colorMode.forced = true
  const route = useRoute();
  const hideNav = route.query['electron'] == '1';
  await useAuth();
</script>