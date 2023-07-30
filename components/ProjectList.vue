<template>
  <h2>Project list</h2>
  <ul v-if="!loading">
    <li v-for="project in projects" :key="project.id">
        {{ project.id }}
        {{ project.name }}
    </li>
  </ul>
  <ul v-else>
    loading...
  </ul>
</template>

<script setup lang="ts">
  const { loading, projects } = await useProjects();
</script>