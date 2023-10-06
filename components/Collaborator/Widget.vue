<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <CardHeader>
          Collaborators
          <UTooltip class="ml-2" :ui="{base: 'p-2 text-xs'}">
            <template #text>
              <p class="mb-3">
                If invited email is already registered on manuscrape, they will recieve access right away. If not, they will get access once they sign up on manuscrape. In that case, the invitation expire after one week.
              </p>
              <p>
                Manuscrape stores invitations by using one-way encryption on the emails. (aka. hashing). This prevents you from seeing the invited email, however, it makes the invitation system more complaint with GDPR.
              </p>
            </template>
            <UIcon class="text-lg" name="i-heroicons-information-circle" />
          </UTooltip>
        </CardHeader>
      </div>
    </template>
    <div class="flex gap-4">
      <UInput type="email" v-model="email" placeholder="Enter email" />
      <UButton variant="outline" color="blue" icon="i-heroicons-user-plus" :disabled="!validEmail" @click="onSubmit">Add contributor</UButton>
    </div>
    <CollaboratorList :collaborators="collaborators" :loading="collaboratorsLoading" />
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

  const { params } = useRoute();
  const {
    addCollaborator,
  } = await useProjects(params);


  const {
    data: collaboratorsResponse,
    pending: collaboratorsLoading,
    refresh: collaboratorsRefresh,
  } = await useFetch<{ collaborators: Collaborator[] }>(
    () => `/api/projects/${props.project.id}/collaborators`,
    {
      watch: [props.project],
      method: 'GET',
      immediate: true,
      server: true,
      credentials: 'include',
      onResponse: async (context) => {
        console.log('collaborator error!')
        if (context.response.status === 401) {
          await navigateTo('/login', { replace: true })
        }
      },
      onResponseError: async (context) => {
        console.log('collaborator error!')
        if (context.response.status === 401) {
          await navigateTo('/login', { replace: true })
        }
      }
    }
  );

  const collaborators = computed<Collaborator[]>(() => {
    return collaboratorsResponse.value?.collaborators || [];
  })

  async function onSubmit() {
    if (!validEmail.value) {
      toast.add({
        title: 'Invalid email',
        color: 'red'
      });
      return;
    }

    await addCollaborator(props.project?.id, email.value).then(async (res: Response) => {
      if ([201, 202].includes(res.status)) {
        const msg = res.status === 202
          ? 'Collaborator has been added!'
          : 'Invitation has been created, and is valid for 7 days.';

        toast.add({
          title: 'Success!',
          description: msg,
          color: 'green'
        });

        await collaboratorsRefresh();
      } else {
        throw res;
      }
    }).catch(async (res: Response) => {
      const json = await res.json();
      const msg = getErrMsg(json);
      toast.add({
        title: 'Error',
        description: msg,
        color: 'red'
      });
    })
  }
</script>