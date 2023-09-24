<template>
  <UContainer>
    <div class="title">
      <h2 class="text-3xl mb-8">Profile</h2>
    </div>
    <UCard v-if="user" class="max-w-sm">
      <div class="grid grid-cols-2 mb-5">
        <span class="text-gray-500">Email:</span>
        <span>{{ user?.email }}</span>
        <span class="text-gray-500">Created at:</span>
        <span>{{ prettyDate(user.createdAt) }}</span>
      </div>
      <UButton color="red" @click="() => openDeleteModal = true">Delete user</UButton>
    </UCard>
  </UContainer>
  <ModalDeleteUser :open="openDeleteModal" :on-close="() => openDeleteModal = false" />
</template>

<script lang="ts" setup>
  const { ensureUserFetched } = await useAuth();
  await ensureUserFetched();
  const { user } = await useUser();
  const openDeleteModal = ref(false);
</script>
