<template>
  <div>
    <h1>Welcome to the homepage</h1>
    <AppAlert>
      This is an auto-imported component
    </AppAlert>
  </div>
</template>

<script lang="ts" setup>
  definePageMeta({
    middleware: 'auth' // this should match the name of the file inside the middleware directory 
  })
</script>