<template>
  <footer v-if="!isElectron">
    <UContainer class="pb-8">
      <div class="border-b border-b-gray-600 w-full mb-8"></div>
      ManuScrape v{{ version }}
    </UContainer>
  </footer>
</template>

<style scoped lang="scss">
  footer {
    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
    padding-top: 20px;
    color: #888;
    font-size: 0.8rem;
  }
</style>

<script setup lang="ts">
  const { version } = useRuntimeConfig().public;
  const isElectron = runsInElectron();
</script>