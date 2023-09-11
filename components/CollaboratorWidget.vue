<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between w-full">
        Collaborators
      </div>
    </template>
    <div class="flex gap-4">
      <UInput type="email" v-model="email" placeholder="Enter email" />
      <UButton :disabled="!validEmail" @click="onSubmit">Add collaborator</UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
  const props = defineProps({
    project: Object as PropType<FullProject>,
  });
  
  if (!props.project?.id) {
    throw new Error('Project id is not defined in component props')
  }

  const toast = useToast();
  const email = ref('');
  const validEmail = computed(() => {
    return isEmail(email.value);
  })

  const { addCollaborator } = await useProjects();

  async function onSubmit() {
    if (!validEmail.value) {
      throw new Error('Email is not valid');
    }


    if (!props.project?.id) {
      throw new Error('Project id is not defined in component props')
    }

    // TODO: handle response (create better toasts)
    const res = await addCollaborator(props.project?.id, email.value);
    toast.add({
      title: 'TODO: improve this message',
      description: 'Collaborator might have been added! ;o)'
    });
  }
</script>