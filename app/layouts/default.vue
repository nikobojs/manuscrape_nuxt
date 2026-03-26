<template>
  <div class="bg-gray-950">
    <Header v-if="!isElectron" />
    <main class="pt-9 pb-6 min-h-[calc(100vh-180px)]">
      <slot />
    </main>
    <Footer />
  </div>
  <UNotifications />
</template>

<script lang="ts" setup>
const colorMode = useColorMode();
colorMode.value = "dark";
colorMode.forced = true;
const { isElectron } = useDevice();

await useAuth();
</script>
