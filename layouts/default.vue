<template>
  <div>
    <AppHeader />
    <main class="mt-20">
      <slot />
    </main>
    <AppFooter />
  </div>
  <UNotifications />
</template>

<script lang="ts" setup>
  const colorMode = useColorMode();
  colorMode.value = 'dark'
  colorMode.forced = true
  await useAuth();
</script>