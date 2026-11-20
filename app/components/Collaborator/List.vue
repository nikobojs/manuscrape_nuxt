<template>
  <UTable :data="collaborators" :loading="loading" :columns="columns">
    <template #name-cell="{ row }">
      {{ row.original.user_name || "Deleted user" }}
    </template>
    <template #role-cell="{ row }">
      <UBadge variant="outline" color="neutral">{{ row.original.role }}</UBadge>
    </template>
    <template #nameInProject-cell="{ row }">
      <span class="flex items-start gap-x-2">
        {{ row.original.nameInProject }}
        <UIcon
          name="i-mdi-pencil-outline"
          class="opacity-80 hover:opacity-100 transition-opacity cursor-pointer text-lg"
          @click="() => onEditAlias(row.original)"
        />
      </span>
    </template>
    <template #createdAt-cell="{ row }">
      {{ prettyDate(row.original.createdAt) }}
    </template>
    <template #actions-cell="{ row }">
      <div class="flex h-full w-full items-center self-end justify-end">
        <span class="text-red-500 text-lg">
          <UTooltip>
            <UIcon
              @click="() => handleRemoveCollaborator(row.original)"
              class="cursor-pointer"
              name="i-heroicons-trash"
            />
            <template #content>
              <div>
                <div class="break-words whitespace-normal">
                  Remove collaborator from project.
                </div>
                <div class="break-words whitespace-normal">
                  This action will <i class="italic">not</i> remove the user's
                  email from their submitted observations.
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
import type { TableColumn } from "#ui/types";
const props = defineProps({
  project: requireProjectProp,
  collaborators: requireProp<Collaborator[]>(Array),
  loading: requireProp<boolean>(Boolean),
  onEditAlias: requireFunctionProp<(c: Collaborator) => void | Promise<void>>(),
});

const { params } = useRoute();
const toast = useToast();
const { refreshUser } = await useUser();
const { removeCollaborator } = await useProjects(params);

const columns: TableColumn<any>[] = [
  {
    header: "Name",
    accessorKey: "name",
  },
  {
    header: "Role",
    accessorKey: "role",
  },
  {
    header: "Alias",
    accessorKey: "nameInProject",
  },
  {
    header: "Permission created at",
    accessorKey: "createdAt",
  },
  {
    header: "",
    accessorKey: "actions",
  },
];

function handleRemoveCollaborator(collaborator: Collaborator) {
  // TODO: create nice confirm box
  const res = confirm(
    `Are you sure you want to remove '${collaborator.user_name || "Deleted user"}' from the project?`,
  );
  if (!res) {
    return;
  }

  removeCollaborator(props.project.id, collaborator.user_id)
    .then(async (res) => {
      if (res.status !== 200) {
        throw res;
      }

      toast.add({
        title: "Collaborator was removed from project",
        color: "success",
        icon: "i-heroicons-check",
      });
      await refreshUser();
    })
    .catch(async (res: Response) => {
      const json = await res.json();
      const msg = getErrMsg(json);
      toast.add({
        title: msg,
        color: "error",
        icon: "i-heroicons-exclamation-triangle",
      });
    });
}
</script>
