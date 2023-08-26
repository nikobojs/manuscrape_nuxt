<template>
    <h2 v-if="projects && projects.length > 0" class="text-3xl mb-3">Projects</h2>
    <div class="grid grid-cols-5 gap-5 mb-10">
      <div
        v-for="project in projects"
        class="group border rounded-md border-gray-800 bg-gray-900 p-4 cursor-pointer"
        @click="() => openProject(project)"
      >
        <div class="group-hover:underline text-lg mb-2">{{ project.name }}</div>
        <div class="text-sm">{{ project.fields.length }} fields</div>
        <div class="text-sm text-gray-500">Created {{ dateOnly(project.createdAt) }}</div>
      </div>
    </div>
</template>

<script setup lang="ts">
  const { projects } = await useProjects();
  const dateOnly = (d: Date | string) => new Date(d).toLocaleDateString();

  function openProject(project: FullProject) {
    navigateTo('/projects/' + project.id)
  }
</script>