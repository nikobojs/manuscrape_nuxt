<script lang="ts" setup>
// Redirect logic handled by route middleware
definePageMeta({
  middleware: ['redirect-auth']
});
</script>

<template>
  <div>
    <!-- Loading state, should be redirected before this renders -->
    <p>Loading...</p>
  </div>
</template>
