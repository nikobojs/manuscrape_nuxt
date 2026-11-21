<template>
  <div
    class="bg-gray-950 min-h-[calc(100vh-10px)] flex flex-col justify-between"
  >
    <div>
      <Header v-if="!isElectron" />
      <main :class="isElectron ? 'pt-3 pb-3' : 'pt-9 pb-6'">
        <slot />
      </main>
    </div>
    <Footer />
  </div>
</template>

<script lang="ts" setup>
const { isElectron } = useDevice();

await useAuth();
</script>
