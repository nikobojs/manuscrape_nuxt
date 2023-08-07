<template>
  <div>
    <AppHeader />
    <main class="mt-20">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<script lang="ts" setup>
  await useAuth();
</script>