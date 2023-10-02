<template>
  <ProjectForm :onClose="onClose" />
</template>

<script setup lang="ts">

function onClose() {
  if (runsInElectron()) {
    window.close();
  }
}
</script>