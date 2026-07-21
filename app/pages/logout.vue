<template>
  <div>Signing out...</div>
</template>

<script setup lang="ts">
const { signOut, ensureUserFetched } = await useAuth();
const { clearAllMetadataDrafts } = useMetadataDraftStore();
await ensureUserFetched();
const { user } = await useUser();
if (!user.value) {
  navigateTo("/login");
} else {
  clearAllMetadataDrafts();
  await signOut();
}
</script>
