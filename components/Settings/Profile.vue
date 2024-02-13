<template>
  <SettingsBox
    title="User Management"
    help="All settings and actions regarding your personal ManuScrape account. For any questions, please contact the server administrator."
  >
    <div v-if="user" class="max-w-sm">
      <div class="grid grid-cols-2 mb-5">
        <span class="text-gray-500">Email:</span>
        <span>{{ user?.email }}</span>
        <span class="text-gray-500">Created at:</span>
        <span>{{ prettyDate(user.createdAt) }}</span>
      </div>
      <UButton color="red" @click="() => openDeleteModal = true">Delete user</UButton>
    </div>
    <ProfileDeleteUserModal
      :open="openDeleteModal"
      :on-close="() => openDeleteModal = false"
    />
  </SettingsBox>
</template>

<script lang="ts" setup>
  const { ensureUserFetched } = await useAuth();
  await ensureUserFetched();
  const { user } = await useUser();
  const openDeleteModal = ref(false);
</script>