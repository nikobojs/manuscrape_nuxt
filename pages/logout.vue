<template>
    <div>Signing out...</div>
</template>

<script setup lang="ts">
    const { isLoggedIn, signOut } = await useAuth();
    onMounted(() => {
        if (!isLoggedIn.value) {
            navigateTo('/login')
        } else {
            signOut().then(() => {
                navigateTo('/login?sign_out=1')
            });
        }
    })
</script>