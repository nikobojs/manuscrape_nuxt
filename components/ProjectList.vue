<template>
    <h2 v-if="projects && projects.length > 0" class="text-3xl mb-3">Projects</h2>
    <div class="grid grid-cols-5 gap-5 mb-10">
      <div
        v-for="project in projects"
        class="group border rounded-md border-gray-800 bg-gray-900 p-4 cursor-pointer relative"
        @click="() => openProject(project)"
      >
        <Transition mode="out-in" name="fade">
          <div v-if="!hideAllPings && newProjectId == project.id" class="absolute flex -top-1 right-3">
            <span
              class="opacity-100 relative transition-opacity flex h-3 w-3 -right-5 self-end"
            >
              <span class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-sky-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </div>
        </Transition>
        <div class="group-hover:underline text-lg mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
          {{ project.name }}
        </div>
        <div class="text-sm">{{ project.fields.length }} fields</div>
        <div class="text-sm text-gray-500">Created {{ dateOnly(project.createdAt) }}</div>
      </div>
    </div>
</template>

<script setup lang="ts">
  const props = defineProps({
    newProjectId: requireProp<number>(Number)
  });

  const { projects } = await useProjects();
  const dateOnly = (d: Date | string) => new Date(d).toLocaleDateString();
  const hideAllPings = ref(false);

  function openProject(project: FullProject) {
    navigateTo('/projects/' + project.id)
  }

  function hidePings() {
    setTimeout(() => {
      hideAllPings.value = true;
    }, 5000);
  }

  const _newProjectId = computed(() => props.newProjectId);
  watch([_newProjectId], hidePings);
</script>

<style>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s ease-out;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>