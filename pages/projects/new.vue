<template>
  <UContainer>
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