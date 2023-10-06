<template>
  <slot />
</template>

<script setup lang="ts">
  const { params } = useRoute();
  const { project } = await useProjects(params);
  const toast = useToast();
  let projectId: number | undefined = undefined;
  
  if (params.projectId && !project) {
    toast.add({
      title: 'No access to project',
      description: '... or it doesn\'t exist',
    });

    navigateTo('/', { redirectCode: 302 });
  }

  if (params.observationId && project.value?.id) {
    try {
      const { requireObservationFromParams } = await useObservations(project.value?.id);
      requireObservationFromParams(params);
    } catch(e) {
      toast.add({
        title: 'No access to observation',
        description: '... or it doesn\'t exist',
      });

      navigateTo('/', { redirectCode: 302 });
    }
  } else if (params.observationId && !project.value) {
      toast.add({
        title: 'No access to observation',
        description: '... or it doesn\'t exist',
      });

      navigateTo('/', { redirectCode: 302 });
  }

</script>