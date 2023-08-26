<template></template>
<script lang="ts" setup>
  const route = useRoute();
  const path = route.fullPath.replace(/\/observations(\/?)/, '');
  navigateTo(path);
</script>