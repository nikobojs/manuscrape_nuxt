<template>
  <div v-show="true">
    <AppHeader />
    <slot />
    <AppFooter />
  </div>
</template>

<script lang="ts" setup>
const { hasFetched } = await useAuth();
</script>