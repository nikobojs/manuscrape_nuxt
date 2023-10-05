<template>
  <ProjectCreateWidget :onClose="onClose" />
</template>

<script setup lang="ts">

const { isElectron } = useDevice();

function onClose() {
  if (isElectron.value) {
    window.close();
  }
}
</script>