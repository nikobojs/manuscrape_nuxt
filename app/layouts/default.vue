<template>
  <div class="bg-gray-950">
    <Header v-if="!isElectron" />
    <main
      class="min-h-[calc(100vh-180px)]"
      :class="isElectron ? 'pt-3 pb-3' : 'pt-9 pb-6'"
    >
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
