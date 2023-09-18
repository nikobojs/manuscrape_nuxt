<template>
  <slot />
</template>

<script setup>
  const { requireProjectFromParams } = await useProjects();
  const { requireObservationFromParams } = await useObservations();
  const { params } = useRoute();
  const toast = useToast();
  
  if (params.projectId) {
    try {
      requireProjectFromParams(params);
    } catch(e) {
      toast.add({
        title: 'No access to project',
        description: '... or it doesn\'t exist',
      });

      navigateTo('/', { redirectCode: 302 });
    }
  }

  if (params.observationId) {
    try {
      requireObservationFromParams(params);
    } catch(e) {
      toast.add({
        title: 'No access to observation',
        description: '... or it doesn\'t exist',
      });

      navigateTo('/', { redirectCode: 302 });
    }
  }
</script>