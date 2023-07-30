<template>
    <div>Signing out...</div>
</template>

<script setup lang="ts">
    const { signOut, ensureUserFetched } = await useAuth();
    await ensureUserFetched();
    const { user } = await useUser();
    if (!user.value) {
        navigateTo('/login')
    } else {
        signOut().finally(() => {
            navigateTo('/login?sign_out=1')
        });
    }
</script>