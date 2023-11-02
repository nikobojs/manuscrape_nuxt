<template>
  <UTable
    :rows="collaborators"
    :loading="loading"
    :columns="columns"
  >
    <template #email-data="{ row }">
      {{ row.user.email }}
    </template>
    <template #role-data="{ row }">
      {{ row.role }}
    </template>
    <template #createdAt-data="{ row }">
      {{ prettyDate(row.createdAt) }}
    </template>
    <template #actions-data="{ row }">
      <div class="flex h-full w-full items-center self-end justify-end">
        <span class="text-red-500 text-lg">
          <UTooltip>
            <UIcon @click="() => handleRemoveCollaborator(row)" class="cursor-pointer" name="i-heroicons-trash" />
            <template #text>
              <div>
                <div class="break-words whitespace-normal">
                  Remove collaborator from project.
                </div>
                <div class="break-words whitespace-normal">
                  This action will <i class="italic">not</i> remove the user's email from their submitted observations.
                </div>
              </div>
              </template>
          </UTooltip>
        </span>
      </div>
    </template>
  </UTable>
</template>

<script setup lang="ts">
  const props = defineProps({
    project: requireProjectProp,
    collaborators: requireProp<Collaborator[]>(Array),
    loading: requireProp<boolean>(Boolean),
  });

  const { params } = useRoute();
  const toast = useToast();
  const { refreshUser } = await useUser();
  const { removeCollaborator } = await useProjects(params);

  const columns = [{
    label: 'Email',
    key: 'email',
  }, {
    label: 'Role',
    key: 'role',
  }, {
    label: 'Permission created at',
    key: 'createdAt',
  }, {
    label: '',
    key: 'actions',
  }];

  function handleRemoveCollaborator(collaborator: Collaborator) {
    // TODO: create nice confirm box
    const res = confirm(`Are you sure you want to remove '${collaborator?.user?.email}' from the project?`);
    if (!res) {
      return;
    }

    removeCollaborator(props.project.id, collaborator.user.id).then(async (res) => {
      if (res.status !== 200) {
        throw res;
      }

      toast.add({
        title: 'Collaborator was removed from project',
        color: 'green',
        icon: 'i-heroicons-check'
      });
      await refreshUser();
    }).catch(async (res: Response) => {
      const json = await res.json();
      const msg = getErrMsg(json);
      toast.add({
        title: msg,
        color: 'red',
        icon: 'i-heroicons-exclamation-triangle'
      });
    })
  }
</script>