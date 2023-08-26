<template>
  <div>
    <AppHeader v-if="!hideNav" />
    <Breadcrumb v-if="!hideNav" />
    <main class="mt-9">
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
  const route = useRoute();
  const hideNav = route.query['electron'] == '1';
  await useAuth();
</script>