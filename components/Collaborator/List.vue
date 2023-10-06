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
  </UTable>
</template>

<script setup lang="ts">
  defineProps({
    collaborators: requireProp<Collaborator[]>(Array),
    loading: requireProp<boolean>(Boolean),
  });

  const columns = [{
    label: 'Email',
    key: 'email',
  }, {
    label: 'Role',
    key: 'role',
  }, {
    label: 'Permission created at',
    key: 'createdAt',
  }]
</script>