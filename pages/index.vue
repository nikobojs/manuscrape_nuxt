<template>
  <div>
    <h1>Welcome, {{ user?.email }}!</h1>
    <AppAlert>
      This is an auto-imported component
    </AppAlert>
  </div>
</template>

<script lang="ts" setup>
  const { user } = await useAuth();
</script>