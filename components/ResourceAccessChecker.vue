<template>
  <slot />
</template>

<script setup lang="ts">
  const { requireProjectFromParams } = await useProjects();
  const { params } = useRoute();
  const toast = useToast();
  let projectId: number | undefined = undefined;
  
  if (params.projectId) {
    try {
      projectId = requireProjectFromParams(params)?.id;
    } catch(e) {
      toast.add({
        title: 'No access to project',
        description: '... or it doesn\'t exist',
      });

      navigateTo('/', { redirectCode: 302 });
    }

    if (params.observationId && typeof projectId === 'number') {
      try {
        const { requireObservationFromParams } = await useObservations(projectId);
        requireObservationFromParams(params);
      } catch(e) {
        toast.add({
          title: 'No access to observation',
          description: '... or it doesn\'t exist',
        });

        navigateTo('/', { redirectCode: 302 });
      }
    }
  }

</script>