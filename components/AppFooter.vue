<template>
  <footer v-if="!isElectron">
    <UContainer class="pb-8 pt-12 text-xs text-gray-500">
      ManuScrape v{{ version }}
    </UContainer>
  </footer>
</template>

<script setup lang="ts">
import { useDevice } from '~/composables/useDevice';

  const { version } = useRuntimeConfig().public;
  const { isElectron } = useDevice();
</script>