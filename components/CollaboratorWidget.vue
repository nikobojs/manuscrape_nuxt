<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between w-full">
        Collaborators
        <div class="flex items-center">
         <UBadge size="xs" color="yellow">WARN: In development</UBadge>         
        </div>
      </div>
    </template>
    <div class="flex gap-4">
      <UInput type="email" v-model="email" placeholder="Enter email" />
      <UButton variant="outline" color="blue" icon="i-heroicons-user-plus" :disabled="!validEmail" @click="onSubmit">Add contributor</UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
  const props = defineProps({
    project: requireProjectProp,
  });
  
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

    await addCollaborator(props.project?.id, email.value).then((res) => {
      toast.add({
        title: 'Success!',
        description: 'Contributer has been added!',
        color: 'green'
      });
    }).catch(res => {
      const msg = getErrMsg(res);
      toast.add({
        title: 'Error',
        description: msg,
        color: 'red'
      });
    })
  }
</script>