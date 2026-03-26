<template>
  <UContainer>
    <p
      class="opacity-0 transition-opacity"
      :class="{ 'opacity-100': isVisible }"
    >
      Redirecting...
    </p>
  </UContainer>
</template>

<script lang="ts" setup>
const isVisible = ref(false);
const { ensureLoggedIn } = await useAuth();
await useUser();
await ensureLoggedIn();
navigateTo("/projects");
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 250);
});
</script>
