<template>
  <div class="bg-gray-950">
    <Header v-if="!isElectron" />
    <main class="pt-9 pb-6">
      <slot />
    </main>
    <Footer v-if="!isElectron" />
  </div>
  <UNotifications />
</template>

<script lang="ts" setup>
  const colorMode = useColorMode();
  colorMode.value = 'dark'
  colorMode.forced = true
  const { isElectron } = useDevice();
  
  await useAuth();
</script>