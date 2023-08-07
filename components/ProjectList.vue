<template>
  <h2 class="text-3xl mb-3">Project list</h2>
  <UCard>
    <UTable v-if="!loading" :rows="projects">
    </UTable>
    <ul v-else>
      loading...
    </ul>
  </UCard>
</template>

<script setup lang="ts">
  const { loading, projects } = await useProjects();
</script>