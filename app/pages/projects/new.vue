<template>
  <UContainer :class="isElectron ? 'mt-3' : 'mt-9 xl:mt-16'">
    <ProjectCreateWidget :onClose="onClose" />
  </UContainer>
</template>

<script setup lang="ts">
const { isElectron } = useDevice();

function onClose() {
  if (isElectron.value) {
    window.close();
  }
}
</script>
